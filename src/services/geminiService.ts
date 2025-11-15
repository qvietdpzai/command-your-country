
import { GameStats, TurnResponse } from '../types';
import { generateEmblemSVG } from './emblemService';

// The endpoint for our Netlify function
const API_ENDPOINT = '/.netlify/functions/gemini-api';

// Helper function to call our backend function
const callApi = async (action: string, payload