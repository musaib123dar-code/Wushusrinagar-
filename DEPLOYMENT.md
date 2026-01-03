# Deployment Guide - VideoConf Platform

Complete guide for deploying the VideoConf video conferencing platform to production.

## Prerequisites

- Docker & Docker Compose installed
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)
- Node.js 20+ (for local development)
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

## Deployment Options

### 1. Docker Compose (Recommended for Quick Start)

#### Step 1: Clone and Configure

```bash
git clone <repository-url>
cd videoconf

# Copy environment file
cp backend/.env.example backend/.env
```

#### Step 2: Edit Environment Variables

Edit `backend/.env`:

```env
# Production Settings
NODE_ENV=production
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=videoconf_db
DB_USER=postgres
DB_PASSWORD=<strong-password>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secrets (Generate strong random strings)
JWT_SECRET=<your-super-secret-jwt-key>
JWT_REFRESH_SECRET=<your-refresh-token-secret>

# CORS (Your domain)
CORS_ORIGIN=https://yourdomain.com

# AWS S3 (for recordings)
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=videoconf-recordings

# SMTP (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASSWORD=<your-password>

# TURN Server (for WebRTC NAT traversal)
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_USERNAME=<turn-username>
TURN_PASSWORD=<turn-password>
```

#### Step 3: Start Services

```bash
cd infrastructure/docker
docker-compose up -d
```

#### Step 4: Run Database Migrations

```bash
docker exec -it videoconf-backend npm run migrate
```

#### Step 5: Verify Deployment

```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoint
curl http://localhost/api/health
```

### 2. AWS Cloud Deployment

#### Architecture Overview

```
┌─────────────────┐
│   CloudFront    │ (CDN)
└────────┬────────┘
         │
┌────────▼────────┐
│   ALB/NLB       │ (Load Balancer)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│  ECS  │ │  ECS  │ (Container Service)
│Backend│ │  Web  │
└───┬───┘ └───────┘
    │
┌───▼───┐
│  RDS  │ (PostgreSQL)
└───────┘
    │
┌───▼───────┐
│ElastiCache│ (Redis)
└───────────┘
    │
┌───▼───┐
│   S3  │ (Storage)
└───────┘
```

#### Step 1: Setup RDS Database

```bash
aws rds create-db-instance \
  --db-instance-identifier videoconf-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password <your-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --publicly-accessible false
```

#### Step 2: Setup ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id videoconf-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name your-subnet-group \
  --security-group-ids sg-xxxxx
```

#### Step 3: Setup S3 Bucket

```bash
aws s3 mb s3://videoconf-recordings
aws s3api put-bucket-cors \
  --bucket videoconf-recordings \
  --cors-configuration file://cors.json
```

#### Step 4: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -f infrastructure/docker/Dockerfile.backend -t videoconf-backend .
docker tag videoconf-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/videoconf-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/videoconf-backend:latest

# Build and push web
docker build -f infrastructure/docker/Dockerfile.web -t videoconf-web .
docker tag videoconf-web:latest <account>.dkr.ecr.us-east-1.amazonaws.com/videoconf-web:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/videoconf-web:latest
```

#### Step 5: Create ECS Task Definitions

Create `task-definition.json`:

```json
{
  "family": "videoconf-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account>.dkr.ecr.us-east-1.amazonaws.com/videoconf-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DB_HOST", "value": "<rds-endpoint>"},
        {"name": "REDIS_HOST", "value": "<elasticache-endpoint>"}
      ],
      "secrets": [
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/videoconf-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 6: Create ECS Service

```bash
aws ecs create-service \
  --cluster videoconf-cluster \
  --service-name videoconf-backend \
  --task-definition videoconf-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3000"
```

#### Step 7: Setup Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name videoconf-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing

aws elbv2 create-target-group \
  --name videoconf-backend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip

aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### 3. Kubernetes Deployment

#### Prerequisites

- Kubernetes cluster (EKS, GKE, or AKS)
- kubectl configured
- Helm 3+ installed

#### Step 1: Create Namespace

```bash
kubectl create namespace videoconf
```

#### Step 2: Create Secrets

```bash
kubectl create secret generic videoconf-secrets \
  --from-literal=jwt-secret=<your-jwt-secret> \
  --from-literal=jwt-refresh-secret=<your-refresh-secret> \
  --from-literal=db-password=<db-password> \
  --namespace=videoconf
```

#### Step 3: Deploy PostgreSQL

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql \
  --namespace videoconf \
  --set auth.postgresPassword=<password> \
  --set auth.database=videoconf_db
```

#### Step 4: Deploy Redis

```bash
helm install redis bitnami/redis \
  --namespace videoconf \
  --set auth.enabled=false
```

#### Step 5: Deploy Application

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: videoconf-backend
  namespace: videoconf
spec:
  replicas: 3
  selector:
    matchLabels:
      app: videoconf-backend
  template:
    metadata:
      labels:
        app: videoconf-backend
    spec:
      containers:
      - name: backend
        image: <your-registry>/videoconf-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: DB_HOST
          value: postgres-postgresql
        - name: REDIS_HOST
          value: redis-master
        envFrom:
        - secretRef:
            name: videoconf-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: videoconf-backend
  namespace: videoconf
spec:
  selector:
    app: videoconf-backend
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

Apply deployment:

```bash
kubectl apply -f k8s-deployment.yaml
```

### 4. Setup TURN Server (Critical for WebRTC)

For production WebRTC, you need a TURN server for NAT traversal.

#### Option 1: Coturn (Self-hosted)

```bash
# Install coturn
sudo apt-get install coturn

# Configure /etc/turnserver.conf
listening-port=3478
fingerprint
lt-cred-mech
user=username:password
realm=yourdomain.com
external-ip=<your-server-ip>

# Start coturn
sudo systemctl start coturn
sudo systemctl enable coturn
```

#### Option 2: Managed TURN Services

- Twilio STUN/TURN
- Xirsys
- Metered.ca

### 5. SSL/TLS Configuration

#### Using Let's Encrypt with Nginx

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

#### Update Nginx Config

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] SSL certificate installed and working
- [ ] TURN server configured and accessible
- [ ] Environment variables set correctly
- [ ] Health check endpoints responding
- [ ] WebSocket connections working
- [ ] WebRTC peer connections establishing
- [ ] S3 bucket for recordings configured
- [ ] SMTP for email notifications working
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security audit performed

## Monitoring Setup

### Logging with CloudWatch (AWS)

```bash
# Create log group
aws logs create-log-group --log-group-name /videoconf/backend

# Enable container insights
aws ecs update-cluster-settings \
  --cluster videoconf-cluster \
  --settings name=containerInsights,value=enabled
```

### Application Monitoring

Add to `backend/src/index.ts`:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

## Scaling Considerations

### Horizontal Scaling

- Run multiple backend instances behind load balancer
- Use Redis for session storage across instances
- Implement sticky sessions for WebSocket connections

### Database Scaling

- Read replicas for PostgreSQL
- Connection pooling (already configured)
- Query optimization and indexing

### WebRTC Scaling

- Consider SFU (Selective Forwarding Unit) for large meetings
- Use media servers like Janus or Mediasoup
- CDN for static content

## Backup Strategy

### Database Backups

```bash
# Automated daily backups
0 2 * * * pg_dump -h <db-host> -U postgres videoconf_db | gzip > /backups/videoconf_$(date +\%Y\%m\%d).sql.gz
```

### S3 Versioning

```bash
aws s3api put-bucket-versioning \
  --bucket videoconf-recordings \
  --versioning-configuration Status=Enabled
```

## Troubleshooting

### Common Issues

1. **WebSocket connections failing**
   - Check CORS configuration
   - Verify load balancer supports WebSocket
   - Check firewall rules

2. **WebRTC peer connections not establishing**
   - Verify TURN server is accessible
   - Check ICE candidate gathering
   - Review firewall rules (UDP ports)

3. **Database connection issues**
   - Verify security groups
   - Check connection string
   - Review connection pool settings

### Debug Commands

```bash
# Check container logs
docker logs videoconf-backend

# Check database connectivity
docker exec videoconf-backend psql -h postgres -U postgres -d videoconf_db

# Test WebSocket connection
wscat -c ws://localhost:3000/socket.io

# Check Redis connection
docker exec videoconf-backend redis-cli -h redis ping
```

## Security Best Practices

1. **Use strong secrets**
   - Generate cryptographically secure JWT secrets
   - Rotate secrets regularly

2. **Network security**
   - Use VPC for AWS resources
   - Implement security groups/firewalls
   - Use private subnets for databases

3. **Application security**
   - Enable rate limiting
   - Implement CORS properly
   - Use Helmet.js for HTTP headers
   - Keep dependencies updated

4. **Data security**
   - Encrypt data at rest (S3, RDS)
   - Use SSL/TLS for all connections
   - Implement proper access controls

## Performance Optimization

1. **CDN for static assets**
   ```bash
   aws cloudfront create-distribution \
     --origin-domain-name videoconf-recordings.s3.amazonaws.com
   ```

2. **Redis caching**
   - Cache frequently accessed data
   - Session storage
   - Real-time presence

3. **Database optimization**
   - Regular VACUUM and ANALYZE
   - Connection pooling
   - Query optimization

## Support & Maintenance

- Monitor error logs daily
- Review performance metrics
- Update dependencies regularly
- Backup verification monthly
- Security updates promptly
- Capacity planning quarterly

---

For additional support, refer to VIDEOCONF_README.md or contact the development team.
