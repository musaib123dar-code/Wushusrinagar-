
import { UserRole, Tournament, User, Announcement, Gender } from './types';

export const INITIAL_ADMIN: User = {
  id: 'adm-1',
  name: 'Showkat Malik',
  email: 'admin@wushu.com',
  role: UserRole.ADMIN,
  joinedDate: '2020-01-01'
};

export const INITIAL_OFFICIALS: User[] = [
  {
    id: 'off-1',
    name: 'Master Faisal',
    email: 'faisal@wushu.com',
    role: UserRole.OFFICIAL,
    joinedDate: '2021-05-10',
    avatar: 'https://picsum.photos/seed/faisal/200/200'
  },
  {
    id: 'off-2',
    name: 'Judge Bilal',
    email: 'bilal@wushu.com',
    role: UserRole.OFFICIAL,
    joinedDate: '2022-01-15',
    avatar: 'https://picsum.photos/seed/bilal/200/200'
  }
];

export const INITIAL_PLAYERS: User[] = [
  {
    id: 'ply-1',
    name: 'Irfan Malik',
    email: 'irfan@wushu.com',
    role: UserRole.PLAYER,
    gender: Gender.MALE,
    academy: 'Sher-e-Kashmir Academy',
    district: 'Srinagar',
    dob: '2005-05-15',
    verified: true,
    status: 'VERIFIED',
    joinedDate: '2022-03-20',
    avatar: 'https://picsum.photos/seed/irfan/200/200',
    stats: { wins: 12, losses: 2, medals: { gold: 3, silver: 1, bronze: 0 } }
  },
  {
    id: 'ply-2',
    name: 'Zaid Ahmad',
    email: 'zaid@wushu.com',
    role: UserRole.PLAYER,
    gender: Gender.MALE,
    academy: 'Wushu Hub Srinagar',
    district: 'Srinagar',
    dob: '2006-08-10',
    verified: true,
    status: 'VERIFIED',
    joinedDate: '2024-11-01',
    avatar: 'https://picsum.photos/seed/zaid/200/200',
    stats: { wins: 0, losses: 0, medals: { gold: 0, silver: 0, bronze: 0 } }
  }
];

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 't-1',
    title: 'District Wushu Championship 2024',
    date: '2024-12-10',
    location: 'Indoor Sports Hall, Polo Ground',
    status: 'UPCOMING',
    description: 'The premier annual event for Srinagar Wushu enthusiasts.',
    categories: ['Junior Boys 56kg', 'Senior Men 65kg'],
    registeredPlayerIds: ['ply-1'],
    assignedOfficialIds: ['off-1'],
    categoryPlayers: {
      'Junior Boys 56kg': ['ply-1'],
      'Senior Men 65kg': []
    }
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a-1',
    title: 'Selection Trials for Nationals',
    content: 'Registration for national selection trials starts on Nov 20.',
    date: '2024-11-05',
    type: 'NOTICE'
  }
];
