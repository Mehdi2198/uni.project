"""
Student API routes - Quiz taking, results, profile.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_student
from app.models import Student, Class, Quiz, QuizAttempt, Enrollment, Question, StudentAnswer
from app.schemas.student import (
    StudentResponse, StudentUpdate, StudentClassResponse,
    StartQuizResponse, SubmitAnswerRequest, SubmitQuizRequest,
    QuizResultResponse, QuizResultQuestion, AttemptHistoryItem
)
from app.schemas.question import QuestionForStudent, QuestionOption
from app.schemas.quiz import QuizForStudent
from app.services.quiz_service import QuizService
from app.services.enrollment_service import EnrollmentService

router = APIRouter()


# ==================== Profile ====================

@router.get("/profile", response_model=StudentResponse)
async def get_profile(
    current_user: Student = Depends(get_current_student)
):
    """Get current student's profile."""
    return StudentResponse.model_validate(current_user)


@router.put("/profile", response_model=StudentResponse)
async def update_profile(
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_student)
):
    """Update student profile."""
    if data.student_id is not None:
        current_user.student_id = data.student_id
    if data.phone_number is not None:
        current_user.phone_number = data.phone_number
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return StudentResponse.model_validate(current_user)


# ==================== Classes ====================

@router.get("/classes", response_model=List[StudentClassResponse])
async def list_enrolled_classes(
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_student)
):
    """List all classes the student is enrolled in."""
    service = EnrollmentService(db)
    classes = service.get_student_classes(current_user.id)
    
    result = []
    for c in classes:
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.class_id == c.id
        ).first()
        
        result.append(StudentClassResponse(
            id=c.id,
            name=c.name,
            description=c.description,
            instructor_name=c.instructor.full_name if c.instructor else "Unknown",
            enrolled_at=enrollment.enrolled_at if enrollment else datetime.utcnow()
        ))
    
    return result


@router.get("/classes/{class_id}/quizzes", response_model=List[QuizForStudent])
async def list_class_quizzes(
    class_id: UUID,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_student)
):
    """List available quizzes for a class."""
    # Check enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.class_id == class_id,
        Enrollment.is_active == True
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    # Get published quizzes
    quizzes = db.query(Quiz).filter(
        Quiz.class_id == class_id,
        Quiz.is_published == True
    ).all()
    
    result = []
    now = datetime.utcnow()
    
    for quiz in quizzes:
        # Count attempts
        attempts_used = db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz.id,
            QuizAttempt.student_id == current_user.id
        ).count()
        
        # Check availability
        is_available = True
        if quiz.start_time and now < quiz.start_time:
            is_available = False
        if quiz.end_time and now > quiz.end_time:
            is_available = False
        if attempts_used >= quiz.max_attempts:
            is_available = False
        
        result.append(QuizForStudent(
            id=quiz.id,
            title=quiz.title,
            description=quiz.description,
            question_count=quiz.question_count,
            time_limit_minutes=quiz.time_limit_minutes,
            max_attempts=quiz.max_attempts,
            start_time=quiz.start_time,
            end_time=quiz.end_time,
            is_available=is_available,
            attempts_used=attempts_used
        ))
    
    return result


# ==================== Quiz Taking ====================

@router.post("/quizzes/{quiz_id}/start", response_model=StartQuizResponse)
async def start_quiz(
    quiz_id: UUID,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_student)
):
    """Start a new quiz attempt."""
    service = QuizService(db)
    
    try:
        attempt = service.start_quiz_attempt(quiz_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    quiz = attempt.quiz
    
    # Get questions in order
    questions = []
    for qid in attempt.questions_order:
        question = db.query(Question).filter(Question.id == UUID(qid)).first()
        if question:
            options = None
            if question.options:
                options = [QuestionOption(**opt) for opt in question.options]
                # Randomize options if enabled
                if quiz.randomize_options:
                    import random
                    random.shuffle(options)
            
            questions.append(QuestionForStudent(
                id=question.id,
                question_text=question.question_text,
                question_type=question.question_type,
                options=options,
                image_url=question.image_url,
                points=question.points
            ))
    
    return StartQuizResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        question_count=quiz.question_count,
        time_limit_minutes=quiz.time_limit_minutes,
        questions=questions,
        started_at=attempt.started_at
    )


@router.get("/attempts/{attempt_id}")
async def get_attempt(
    attempt_id: UUID,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_student)
):
    """Get current attempt with questions (for resuming)."""
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.student_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.is_completed:
        raise HTTPException(status_code=400, detail="Attempt already submitted")
    
    quiz = attempt.quiz
    
    # Get questions and current answers
    questions = []
    for qid in attempt.questions_order:
        question = db.query(Question).filter(Question.id == UUID(qid)).first()
        if question:
            # Get current answer if any
            answer = db.query(StudentAnswer).filter(
                StudentAnswer.attempt_id == attempt_id,
                StudentAnswer.question_id == question.id
            ).first()
            
            options = None
            if question.options:
                options = [QuestionOption(**opt) for opt in question.options]
            
            questions.append({
                "id": str(question.id),
                "question_text": question.question_text,
                "question_type": question.question_type,
                "options": [o.model_dump() for o in options] if options else None,
                "image_url": question.image_url,
                "points": question.points,
                "current_answer": answer.selected_answer if answer else None
            })
    
    return {
        "attempt_id": str(attempt.id),
        "quiz_id": str(quiz.id),
        "title": quiz.title,
        "time_limit_minutes": quiz.time_limit_minutes,
        "started_at": attempt.started_at.isoformat(),
        "questions": questions
    }


@router.post("/attempts/{attempt_id}/answer")
async def submit_single_answer(
    attempt_id: UUID,
    data: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_student)
):
    """Submit a single answer (auto-save)."""
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.student_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    service = QuizService(db)
    
    try:
        answer = service.submit_answer(
            attempt_id=attempt_id,
            question_id=data.question_id,
            selected_answer=data.selected_answer
        )
        return {"saved": True, "question_id": str(data.question_id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/attempts/{attempt_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    attempt_id: UUID,
    data: Optional[SubmitQuizRequest] = None,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_student)
):
    """Submit entire quiz and get results."""
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.student_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    service = QuizService(db)
    
    # Submit any remaining answers
    if data and data.answers:
        for ans in data.answers:
            try:
                service.submit_answer(
                    attempt_id=attempt_id,
                    question_id=ans.question_id,
                    selected_answer=ans.selected_answer
                )
            except ValueError:
                pass  # Ignore errors for already submitted answers
    
    # Submit quiz
    try:
        attempt = service.submit_quiz(attempt_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    quiz = attempt.quiz
    
    # Build result
    result = QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        score=attempt.score,
        total_points=attempt.total_points,
        earned_points=attempt.earned_points,
        passing_score=quiz.passing_score,
        passed=float(attempt.score) >= quiz.passing_score if attempt.score else False,
        time_spent_seconds=attempt.time_spent_seconds,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        show_explanations=quiz.show_explanations
    )
    
    # Include question details if show_results is enabled
    if quiz.show_results:
        questions = []
        for qid in attempt.questions_order:
            question = db.query(Question).filter(Question.id == UUID(qid)).first()
            if not question:
                continue
            
            answer = db.query(StudentAnswer).filter(
                StudentAnswer.attempt_id == attempt_id,
                StudentAnswer.question_id == question.id
            ).first()
            
            options = None
            if question.options:
                options = [QuestionOption(**opt) for opt in question.options]
            
            questions.append(QuizResultQuestion(
                question_id=question.id,
                question_text=question.question_text,
                question_type=question.question_type,
                options=options,
                selected_answer=answer.selected_answer if answer else None,
                correct_answer=question.correct_answer,
                is_correct=answer.is_correct if answer else False,
                points=question.points,
                points_earned=answer.points_earned if answer else 0,
                explanation=question.explanation if quiz.show_explanations else None,
                image_url=question.image_url
            ))
        
        result.questions = questions
    
    return result


@router.get("/attempts/{attempt_id}/results", response_model=QuizResultResponse)
async def get_attempt_results(
    attempt_id: UUID,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_student)
):
    """Get results for a completed attempt."""
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.student_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if not attempt.is_completed:
        raise HTTPException(status_code=400, detail="Quiz not yet submitted")
    
    quiz = attempt.quiz
    
    if not quiz.show_results:
        raise HTTPException(status_code=403, detail="Results not available for this quiz")
    
    # Build result
    result = QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        score=attempt.score,
        total_points=attempt.total_points,
        earned_points=attempt.earned_points,
        passing_score=quiz.passing_score,
        passed=float(attempt.score) >= quiz.passing_score if attempt.score else False,
        time_spent_seconds=attempt.time_spent_seconds,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        show_explanations=quiz.show_explanations
    )
    
    # Include question details
    questions = []
    for qid in attempt.questions_order:
        question = db.query(Question).filter(Question.id == UUID(qid)).first()
        if not question:
            continue
        
        answer = db.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == attempt_id,
            StudentAnswer.question_id == question.id
        ).first()
        
        options = None
        if question.options:
            options = [QuestionOption(**opt) for opt in question.options]
        
        questions.append(QuizResultQuestion(
            question_id=question.id,
            question_text=question.question_text,
            question_type=question.question_type,
            options=options,
            selected_answer=answer.selected_answer if answer else None,
            correct_answer=question.correct_answer,
            is_correct=answer.is_correct if answer else False,
            points=question.points,
            points_earned=answer.points_earned if answer else 0,
            explanation=question.explanation if quiz.show_explanations else None,
            image_url=question.image_url
        ))
    
    result.questions = questions
    
    return result


# ==================== History ====================

@router.get("/history", response_model=List[AttemptHistoryItem])
async def get_quiz_history(
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_student),
    limit: int = 50
):
    """Get quiz attempt history."""
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == current_user.id,
        QuizAttempt.is_completed == True
    ).order_by(QuizAttempt.submitted_at.desc()).limit(limit).all()
    
    result = []
    for attempt in attempts:
        quiz = attempt.quiz
        if not quiz:
            continue
        
        result.append(AttemptHistoryItem(
            attempt_id=attempt.id,
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            class_name=quiz.class_.name if quiz.class_ else "Unknown",
            score=attempt.score,
            passed=float(attempt.score) >= quiz.passing_score if attempt.score else False,
            started_at=attempt.started_at,
            submitted_at=attempt.submitted_at
        ))
    
    return result
