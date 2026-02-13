
export interface CaseResult {
  id: string;
  court: string;
  basisNo: string;
  decisionNo: string;
  date: string;
  summary: string;
  relevanceReason: string;
  citation: string;
  fullText?: string;
  sourceUrl?: string;
}

export interface AnalysisResult {
  claimsIdentified: string[];
  weakPoints: {
    point: string;
    suggestion: string;
  }[];
  recommendedCases: CaseResult[];
  counterArguments: {
    opposingView: string;
    defenseStrategy: string;
  }[];
}

export interface ContractRiskReport {
  contractOverview: string;
  riskScore: number; // 0-100
  riskExplanation: string;
  clauseAnalysis: {
    title: string;
    summary: string;
    pros: string[];
    cons: string[];
    practicalRisk: string;
  }[];
  yargitayInsights: string[];
  riskAlerts: string[];
  revisionRecommendations: {
    clause: string;
    concept: string;
    mitigation: string;
  }[];
  finalAssessment: string;
}

export interface GeneratedPetition {
  title: string;
  content: string;
  version: string;
  change_type?: 'initial' | 'revise';
  diff?: string;
}

export interface ConversionResult {
  conversion_id: string;
  status: 'completed' | 'failed' | 'warning';
  udf_data: any;
  confidence_score: number;
  output_text: string;
}

export interface ForumComment {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
  dislikes: number;
  replies: ForumComment[];
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  content: string;
  date: string;
  likes: number;
  dislikes: number;
  comments: ForumComment[];
  category: string;
}

export type AppTab = 'search' | 'petition-analysis' | 'contract-analysis' | 'petition-generator' | 'file-converter' | 'forum' | 'profile' | 'deadline-calendar';

export interface UserCredits {
  remaining: number;
  total: number;
}

export interface UserProfile {
  name: string;
  role: string;
  email: string;
}
