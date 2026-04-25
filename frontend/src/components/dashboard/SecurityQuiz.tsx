import { useState, useCallback } from "react";
import { 
  Shield, Trophy, AlertTriangle, CheckCircle, XCircle, 
  ArrowLeft, RefreshCw, BookOpen, Target, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generateQuizSession, QuizQuestion } from "@/lib/securityQuiz";

type QuizState = 'intro' | 'playing' | 'result';

const SecurityQuiz = () => {
  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{questionId: number, correct: boolean}[]>([]);

  const startQuiz = useCallback(() => {
    const quizQuestions = generateQuizSession();
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnswers([]);
    setQuizState('playing');
  }, []);

  const handleAnswerSelect = (optionIndex: number) => {
    if (showExplanation) return; // Prevent changing answer
    
    setSelectedAnswer(optionIndex);
    setShowExplanation(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      correct: isCorrect
    }]);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizState('result');
    }
  };

  const getScoreMessage = (percentage: number): { message: string; color: string } => {
    if (percentage >= 90) return { message: "Excellent! You're a security expert! 🏆", color: "text-green-400" };
    if (percentage >= 70) return { message: "Good awareness! Keep learning! 👍", color: "text-cyan-400" };
    if (percentage >= 50) return { message: "Decent, but room for improvement 📚", color: "text-yellow-400" };
    return { message: "Needs improvement - Stay alert! ⚠️", color: "text-red-400" };
  };

  const getDifficultyColor = (category: string) => {
    switch (category) {
      case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Intro Screen
  if (quizState === 'intro') {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
            <img 
              src="/apgs-logo.png" 
              alt="APGS Logo" 
              width="96" 
              height="96"
              className="w-16 h-16 object-contain"
              style={{ filter: 'drop-shadow(0 0 12px rgba(0, 255, 156, 0.3))' }}
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Security Awareness Quiz
            </h1>
            <p className="text-muted-foreground text-lg">
              Test your knowledge and learn to identify common cybersecurity threats
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-semibold text-foreground">10 Questions</h3>
            <p className="text-sm text-muted-foreground">Randomly selected from our question bank</p>
          </div>
          <div className="glass-card p-6 text-center space-y-2">
            <Target className="w-8 h-8 text-cyan-400 mx-auto" />
            <h3 className="font-semibold text-foreground">3 Difficulty Levels</h3>
            <p className="text-sm text-muted-foreground">Easy, Medium, and Hard questions</p>
          </div>
          <div className="glass-card p-6 text-center space-y-2">
            <Award className="w-8 h-8 text-blue-500 mx-auto" />
            <h3 className="font-semibold text-foreground">Learn & Improve</h3>
            <p className="text-sm text-muted-foreground">Detailed explanations for each answer</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-center">Topics Covered:</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Phishing Emails', 'Fake Links', 'Social Engineering', 'Password Safety', 'OTP Scams', 'Malware'].map(topic => (
              <span key={topic} className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm">
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={startQuiz}
            className="px-12 py-6 text-lg bg-gradient-to-r from-primary to-cyan-500 hover:shadow-[0_0_20px_hsl(150_100%_45%_/_0.4)] transition-all duration-300 hover:scale-105"
          >
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }

  // Result Screen
  if (quizState === 'result') {
    const percentage = Math.round((score / questions.length) * 100);
    const scoreInfo = getScoreMessage(percentage);

    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Quiz Complete!</h1>
        </div>

        <div className="text-center space-y-2">
          <div className="text-6xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
            {percentage}%
          </div>
          <p className="text-muted-foreground text-lg">
            {score} out of {questions.length} correct
          </p>
          <p className={`text-xl font-semibold ${scoreInfo.color}`}>
            {scoreInfo.message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-400">{score}</div>
            <div className="text-sm text-muted-foreground">Correct</div>
          </div>
          <div className="glass-card p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-red-400">{questions.length - score}</div>
            <div className="text-sm text-muted-foreground">Incorrect</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={startQuiz}
            className="px-8 bg-gradient-to-r from-primary to-cyan-500 hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.4)]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
        </div>
      </div>
    );
  }

  // Playing Screen
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setQuizState('intro')}
          variant="ghost"
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit Quiz
        </Button>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="text-lg font-bold text-primary">
            Score: {score}/{currentQuestionIndex + (showExplanation ? 1 : 0)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-2" />

      {/* Question Card */}
      <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
            {currentQuestion.question}
          </h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getDifficultyColor(currentQuestion.category)}`}>
            {currentQuestion.category}
          </span>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            let optionStyle = "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card/70";
            
            if (showExplanation) {
              if (index === currentQuestion.correctAnswer) {
                optionStyle = "border-green-500 bg-green-500/10";
              } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
                optionStyle = "border-red-500 bg-red-500/10";
              } else {
                optionStyle = "border-border/30 bg-card/30 opacity-50";
              }
            } else if (index === selectedAnswer) {
              optionStyle = "border-primary bg-primary/10";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${optionStyle} ${
                  !showExplanation ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    showExplanation && index === currentQuestion.correctAnswer
                      ? 'border-green-500 bg-green-500 text-white'
                      : showExplanation && index === selectedAnswer
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-border'
                  }`}>
                    {showExplanation && index === currentQuestion.correctAnswer ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : showExplanation && index === selectedAnswer ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{String.fromCharCode(65 + index)}</span>
                    )}
                  </div>
                  <span className="text-foreground">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-blue-400">Explanation</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {currentQuestion.explanation}
            </p>
            <Button
              onClick={nextQuestion}
              className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.4)]"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityQuiz;
