"""
Quiz service - Handles quiz creation, randomization, and attempt management.
"""
import random
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Quiz, QuizQuestionPool, Question, QuizAttempt, StudentAnswer, Enrollment


class QuizService:
    """Service for quiz operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_quiz(
        self,
        instructor_id: UUID,
        class_id: UUID,
        title: str,
        description: Optional[str],
        question_count: int,
        **kwargs
    ) -> Quiz:
        """Create a new quiz."""
        quiz = Quiz(
            instructor_id=instructor_id,
            class_id=class_id,
            title=title,
            description=description,
            question_count=question_count,
            **kwargs
        )
        
        self.db.add(quiz)
        self.db.commit()
        self.db.refresh(quiz)
        
        return quiz
    
    def add_questions_to_pool(
        self,
        quiz_id: UUID,
        question_ids: List[UUID]
    ) -> int:
        """
        Add questions to quiz pool.
        
        Returns:
            Number of questions added
        """
        added = 0
        for q_id in question_ids:
            # Check if already in pool
            existing = self.db.query(QuizQuestionPool).filter(
                QuizQuestionPool.quiz_id == quiz_id,
                QuizQuestionPool.question_id == q_id
            ).first()
            
            if not existing:
                pool_entry = QuizQuestionPool(
                    quiz_id=quiz_id,
                    question_id=q_id
                )
                self.db.add(pool_entry)
                added += 1
        
        self.db.commit()
        return added
    
    def remove_questions_from_pool(
        self,
        quiz_id: UUID,
        question_ids: List[UUID]
    ) -> int:
        """Remove questions from quiz pool."""
        deleted = self.db.query(QuizQuestionPool).filter(
            QuizQuestionPool.quiz_id == quiz_id,
            QuizQuestionPool.question_id.in_(question_ids)
        ).delete(synchronize_session=False)
        
        self.db.commit()
        return deleted
    
    def get_random_questions(
        self,
        quiz_id: UUID,
        count: int
    ) -> List[Question]:
        """
        Get random questions from the quiz pool.
        
        This is the core randomization algorithm that prevents cheating
        by giving each student a unique set of questions.
        
        Args:
            quiz_id: Quiz ID
            count: Number of questions to select
            
        Returns:
            List of randomly selected questions
        """
        # Get all questions in the pool
        pool_questions = self.db.query(Question).join(
            QuizQuestionPool,
            QuizQuestionPool.question_id == Question.id
        ).filter(
            QuizQuestionPool.quiz_id == quiz_id,
            Question.is_active == True
        ).all()
        
        if len(pool_questions) < count:
            raise ValueError(
                f"Not enough questions in pool. Need {count}, have {len(pool_questions)}"
            )
        
        # Randomly select questions
        return random.sample(pool_questions, count)
    
    def start_quiz_attempt(
        self,
        quiz_id: UUID,
        student_id: UUID
    ) -> QuizAttempt:
        """
        Start a new quiz attempt for a student.
        
        Returns:
            QuizAttempt with randomized questions
        """
        quiz = self.db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise ValueError("Quiz not found")
        
        # Check if quiz is available
        if not quiz.is_published:
            raise ValueError("Quiz is not published")
        
        now = datetime.utcnow()
        if quiz.start_time and now < quiz.start_time:
            raise ValueError("Quiz has not started yet")
        if quiz.end_time and now > quiz.end_time:
            raise ValueError("Quiz has ended")
        
        # Check enrollment
        enrolled = self.db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.class_id == quiz.class_id,
            Enrollment.is_active == True
        ).first()
        
        if not enrolled:
            raise ValueError("Not enrolled in this class")
        
        # Check attempt limits
        attempt_count = self.db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == student_id
        ).count()
        
        if attempt_count >= quiz.max_attempts:
            raise ValueError(f"Maximum attempts ({quiz.max_attempts}) reached")
        
        # Get random questions
        questions = self.get_random_questions(quiz_id, quiz.question_count)
        
        # Randomize question order if enabled
        if quiz.randomize_questions:
            random.shuffle(questions)
        
        # Store question order
        questions_order = [str(q.id) for q in questions]
        
        # Create attempt
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=student_id,
            questions_order=questions_order
        )
        
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        
        return attempt
    
    def submit_answer(
        self,
        attempt_id: UUID,
        question_id: UUID,
        selected_answer: str
    ) -> StudentAnswer:
        """Submit a single answer for a question."""
        attempt = self.db.query(QuizAttempt).filter(
            QuizAttempt.id == attempt_id
        ).first()
        
        if not attempt:
            raise ValueError("Attempt not found")
        
        if attempt.is_completed:
            raise ValueError("Quiz already submitted")
        
        # Check if question is part of this attempt
        if str(question_id) not in attempt.questions_order:
            raise ValueError("Question not part of this attempt")
        
        # Get or create answer
        answer = self.db.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == attempt_id,
            StudentAnswer.question_id == question_id
        ).first()
        
        if answer:
            answer.selected_answer = selected_answer
            answer.answered_at = datetime.utcnow()
        else:
            answer = StudentAnswer(
                attempt_id=attempt_id,
                question_id=question_id,
                selected_answer=selected_answer
            )
            self.db.add(answer)
        
        self.db.commit()
        self.db.refresh(answer)
        
        return answer
    
    def submit_quiz(self, attempt_id: UUID) -> QuizAttempt:
        """
        Submit entire quiz and calculate score.
        """
        attempt = self.db.query(QuizAttempt).filter(
            QuizAttempt.id == attempt_id
        ).first()
        
        if not attempt:
            raise ValueError("Attempt not found")
        
        if attempt.is_completed:
            raise ValueError("Quiz already submitted")
        
        # Get all questions for this attempt
        questions = {
            str(q.id): q for q in 
            self.db.query(Question).filter(
                Question.id.in_([UUID(qid) for qid in attempt.questions_order])
            ).all()
        }
        
        # Calculate score
        total_points = 0
        earned_points = 0
        
        for qid in attempt.questions_order:
            question = questions.get(qid)
            if not question:
                continue
            
            total_points += question.points
            
            # Get answer
            answer = self.db.query(StudentAnswer).filter(
                StudentAnswer.attempt_id == attempt_id,
                StudentAnswer.question_id == UUID(qid)
            ).first()
            
            if answer:
                # Check answer
                is_correct = answer.selected_answer.strip().lower() == question.correct_answer.strip().lower()
                answer.is_correct = is_correct
                answer.points_earned = question.points if is_correct else 0
                
                if is_correct:
                    earned_points += question.points
        
        # Update attempt
        attempt.is_completed = True
        attempt.submitted_at = datetime.utcnow()
        attempt.total_points = total_points
        attempt.earned_points = earned_points
        attempt.score = Decimal(earned_points / total_points * 100) if total_points > 0 else Decimal(0)
        
        if attempt.started_at:
            # Ensure consistent timezone awareness
            started = attempt.started_at.replace(tzinfo=None)
            submitted = attempt.submitted_at.replace(tzinfo=None)
            attempt.time_spent_seconds = int((submitted - started).total_seconds())
        
        self.db.commit()
        self.db.refresh(attempt)
        
        return attempt
    
    def get_quiz_results(self, quiz_id: UUID) -> List[dict]:
        """Get all results for a quiz (for export)."""
        attempts = self.db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.is_completed == True
        ).all()
        
        quiz = self.db.query(Quiz).filter(Quiz.id == quiz_id).first()
        
        results = []
        for attempt in attempts:
            student = attempt.student
            if not student:
                 # Should not happen in normal flow, but safety check
                 continue
                 
            results.append({
                'student_name': student.full_name if student else 'Unknown',
                'telegram_username': student.telegram_username if student else None,
                'student_id': student.student_id if student else None,
                'score': float(attempt.score) if attempt.score else 0,
                'total_points': attempt.total_points,
                'earned_points': attempt.earned_points,
                'passed': float(attempt.score) >= quiz.passing_score if attempt.score and quiz else False,
                'started_at': attempt.started_at,
                'submitted_at': attempt.submitted_at,
                'time_spent_seconds': attempt.time_spent_seconds
            })
        
        # Sort by score descending
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results
