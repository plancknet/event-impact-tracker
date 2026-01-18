export interface QuizOption {
  value: string;
  label: string;
  icon?: any;
}

export interface QuizQuestionData {
  key: string;
  question: string;
  subtitle?: string;
  icon?: any;
  options: QuizOption[];
  multiSelect?: boolean;
}
