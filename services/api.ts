
import { User, Tournament, Bout } from '../types';
// Fix: Import initial data constants from the correct constants.ts file instead of types.ts
import { INITIAL_PLAYERS, INITIAL_OFFICIALS, INITIAL_TOURNAMENTS } from '../constants';

/**
 * API Service Abstraction
 * Currently uses LocalStorage for persistence. 
 * To connect to a real database, replace these method implementations with fetch() calls.
 */

const STORAGE_KEYS = {
  PLAYERS: 'dwa_db_players',
  OFFICIALS: 'dwa_db_officials',
  TOURNAMENTS: 'dwa_db_tournaments',
  BOUTS: 'dwa_db_bouts'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  players: {
    async getAll(): Promise<User[]> {
      await delay(100);
      const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      return data ? JSON.parse(data) : INITIAL_PLAYERS;
    },
    async saveAll(data: User[]): Promise<void> {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(data));
    }
  },
  officials: {
    async getAll(): Promise<User[]> {
      await delay(100);
      const data = localStorage.getItem(STORAGE_KEYS.OFFICIALS);
      return data ? JSON.parse(data) : INITIAL_OFFICIALS;
    },
    async saveAll(data: User[]): Promise<void> {
      localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(data));
    }
  },
  tournaments: {
    async getAll(): Promise<Tournament[]> {
      await delay(100);
      const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
      return data ? JSON.parse(data) : INITIAL_TOURNAMENTS;
    },
    async saveAll(data: Tournament[]): Promise<void> {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(data));
    }
  },
  bouts: {
    async getAll(): Promise<Bout[]> {
      await delay(100);
      const data = localStorage.getItem(STORAGE_KEYS.BOUTS);
      return data ? JSON.parse(data) : [];
    },
    async saveAll(data: Bout[]): Promise<void> {
      localStorage.setItem(STORAGE_KEYS.BOUTS, JSON.stringify(data));
    }
  }
};
