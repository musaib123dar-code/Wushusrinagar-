
export enum UserRole {
  ADMIN = 'ADMIN',
  OFFICIAL = 'OFFICIAL',
  PLAYER = 'PLAYER',
  GUEST = 'GUEST'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export enum EventType {
  SANDA = 'SANDA',
  TAOLU = 'TAOLU'
}

export type PlayerStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gender?: Gender;
  avatar?: string;
  academy?: string;
  district?: string;
  dob?: string;
  weight?: number; 
  verified?: boolean;
  status?: PlayerStatus;
  joinedDate: string;
  stats?: {
    wins: number;
    losses: number;
    medals: { gold: number; silver: number; bronze: number };
  };
}

export interface Tournament {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  description: string;
  categories: string[];
  registeredPlayerIds: string[];
  assignedOfficialIds: string[];
  categoryPlayers: { [category: string]: string[] };
}

export interface Bout {
  id: string;
  tournamentId: string;
  category: string;
  player1Id?: string; 
  player2Id?: string; 
  player1Score: number;
  player2Score: number;
  winnerId?: string;
  officialId?: string;
  round: number;
  matchNumber: number;
  status: 'PENDING' | 'LIVE' | 'FINISHED' | 'BYE';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'NEWS' | 'NOTICE';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
