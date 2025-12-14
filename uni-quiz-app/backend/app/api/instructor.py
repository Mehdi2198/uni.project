"""
Instructor API routes - Classes, Questions, Quizzes, Results.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import aiofiles
import os
from datetime import datetime

from app.database import get_db
from app.api.deps import get_current_instructor
from app.models import Instructor, Class, Question, Quiz, QuizQuestionPool, Enrollment
from app.schemas.instructor import (
    InstructorResponse, InstructorUpdate,
    ClassCreate, ClassUpdate, ClassResponse, ClassListResponse,
    InviteLinkResponse, EnrolledStudentResponse
)
from app.schemas.question import (
    QuestionCreate, QuestionUpdate, QuestionResponse, QuestionListResponse, BulkQuestionImport
)
from app.schemas.quiz import (
    QuizCreate, QuizUpdate, QuizResponse, QuizListResponse,
    AddQuestionsToQuiz, QuizPublish
)
from app.services.enrollment_service import EnrollmentService
from app.services.quiz_service import QuizService
from app.utils.excel import create_quiz_results_excel
from app.config import settings

router = APIRouter()


# ==================== Profile ====================

@router.get("/profile", response_model=InstructorResponse)
async def get_profile(
    current_user: Instructor = Depends(get_current_instructor)
):
    """Get current instructor's profile."""
    return current_user


@router.put("/profile", response_model=InstructorResponse)
async def update_profile(
    data: InstructorUpdate,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Update instructor profile."""
    if data.full_name:
        current_user.full_name = data.full_name
    if data.department is not None:
        current_user.department = data.department
    
    db.commit()
    db.refresh(current_user)
    return current_user


# ==================== Classes ====================

@router.get("/classes", response_model=ClassListResponse)
async def list_classes(
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor),
    skip: int = 0,
    limit: int = 50
):
    """List all classes for current instructor."""
    classes = db.query(Class).filter(
        Class.instructor_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    total = db.query(Class).filter(
        Class.instructor_id == current_user.id
    ).count()
    
    # Add student count
    result = []
    for c in classes:
        class_dict = {
            "id": c.id,
            "instructor_id": c.instructor_id,
            "name": c.name,
            "description": c.description,
            "class_code": c.class_code,
            "invite_link": c.invite_link,
            "is_active": c.is_active,
            "created_at": c.created_at,
            "student_count": c.student_count
        }
        result.append(ClassResponse(**class_dict))
    
    return ClassListResponse(classes=result, total=total)


@router.post("/classes", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Create a new class."""
    new_class = Class(
        instructor_id=current_user.id,
        name=data.name,
        description=data.description
    )
    
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    # Generate invite link
    service = EnrollmentService(db)
    service.generate_invite_link(new_class.id)
    db.refresh(new_class)
    
    return ClassResponse(
        id=new_class.id,
        instructor_id=new_class.instructor_id,
        name=new_class.name,
        description=new_class.description,
        class_code=new_class.class_code,
        invite_link=new_class.invite_link,
        is_active=new_class.is_active,
        created_at=new_class.created_at,
        student_count=0
    )


@router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Get class details."""
    target_class = db.query(Class).filter(
        Class.id == class_id,
        Class.instructor_id == current_user.id
    ).first()
    
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return ClassResponse(
        id=target_class.id,
        instructor_id=target_class.instructor_id,
        name=target_class.name,
        description=target_class.description,
        class_code=target_class.class_code,
        invite_link=target_class.invite_link,
        is_active=target_class.is_active,
        created_at=target_class.created_at,
        student_count=target_class.student_count
    )


@router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: UUID,
    data: ClassUpdate,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Update class details."""
    target_class = db.query(Class).filter(
        Class.id == class_id,
        Class.instructor_id == current_user.id
    ).first()
    
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if data.name is not None:
        target_class.name = data.name
    if data.description is not None:
        target_class.description = data.description
    if data.is_active is not None:
        target_class.is_active = data.is_active
    
    db.commit()
    db.refresh(target_class)
    
    return ClassResponse(
        id=target_class.id,
        instructor_id=target_class.instructor_id,
        name=target_class.name,
        description=target_class.description,
        class_code=target_class.class_code,
        invite_link=target_class.invite_link,
        is_active=target_class.is_active,
        created_at=target_class.created_at,
        student_count=target_class.student_count
    )


@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Delete a class."""
    target_class = db.query(Class).filter(
        Class.id == class_id,
        Class.instructor_id == current_user.id
    ).first()
    
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db.delete(target_class)
    db.commit()


@router.get("/classes/{class_id}/invite-link", response_model=InviteLinkResponse)
async def get_invite_link(
    class_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Get or generate invite link for a class."""
    target_class = db.query(Class).filter(
        Class.id == class_id,
        Class.instructor_id == current_user.id
    ).first()
    
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    service = EnrollmentService(db)
    invite_link = service.generate_invite_link(class_id)
    
    return InviteLinkResponse(
        class_id=class_id,
        class_code=target_class.class_code,
        invite_link=invite_link
    )


@router.get("/classes/{class_id}/students", response_model=List[EnrolledStudentResponse])
async def list_class_students(
    class_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """List all students enrolled in a class."""
    target_class = db.query(Class).filter(
        Class.id == class_id,
        Class.instructor_id == current_user.id
    ).first()
    
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    service = EnrollmentService(db)
    enrollments = service.get_class_students(class_id)
    
    return [
        EnrolledStudentResponse(
            id=e.student.id,
            telegram_id=e.student.telegram_id,
            telegram_username=e.student.telegram_username,
            first_name=e.student.first_name,
            last_name=e.student.last_name,
            student_id=e.student.student_id,
            enrolled_at=e.enrolled_at
        )
        for e in enrollments if e.student
    ]


# ==================== Questions ====================

@router.get("/questions", response_model=QuestionListResponse)
async def list_questions(
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor),
    class_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List questions with optional filters."""
    query = db.query(Question).filter(
        Question.instructor_id == current_user.id,
        Question.is_active == True
    )
    
    if class_id and class_id.strip():
        try:
            query = query.filter(Question.class_id == UUID(class_id))
        except ValueError:
            pass # Ignore invalid UUID
            
    if difficulty and difficulty.strip():
        query = query.filter(Question.difficulty == difficulty)
    if question_type:
        query = query.filter(Question.question_type == question_type)
    
    total = query.count()
    questions = query.offset(skip).limit(limit).all()
    
    return QuestionListResponse(
        questions=[QuestionResponse.model_validate(q) for q in questions],
        total=total
    )


@router.post("/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Create a new question."""
    # Validate class ownership if provided
    if data.class_id:
        target_class = db.query(Class).filter(
            Class.id == data.class_id,
            Class.instructor_id == current_user.id
        ).first()
        if not target_class:
            raise HTTPException(status_code=404, detail="Class not found")
    
    question = Question(
        instructor_id=current_user.id,
        class_id=data.class_id,
        question_text=data.question_text,
        question_type=data.question_type,
        options=[opt.model_dump() for opt in data.options] if data.options else None,
        correct_answer=data.correct_answer,
        explanation=data.explanation,
        image_url=data.image_url,
        points=data.points,
        difficulty=data.difficulty,
        tags=data.tags
    )
    
    db.add(question)
    db.commit()
    db.refresh(question)
    
    return QuestionResponse.model_validate(question)


@router.get("/questions/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Get question details."""
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.instructor_id == current_user.id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return QuestionResponse.model_validate(question)


@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: UUID,
    data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Update a question."""
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.instructor_id == current_user.id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    update_data = data.model_dump(exclude_unset=True)
    
    if 'options' in update_data and update_data['options']:
        update_data['options'] = [opt.model_dump() if hasattr(opt, 'model_dump') else opt for opt in update_data['options']]
    
    for field, value in update_data.items():
        setattr(question, field, value)
    
    question.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(question)
    
    return QuestionResponse.model_validate(question)


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Delete a question (soft delete)."""
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.instructor_id == current_user.id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    question.is_active = False
    db.commit()


@router.post("/questions/bulk", response_model=dict)
async def bulk_import_questions(
    data: BulkQuestionImport,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Bulk import questions."""
    imported = 0
    
    for q_data in data.questions:
        question = Question(
            instructor_id=current_user.id,
            class_id=data.class_id or q_data.class_id,
            question_text=q_data.question_text,
            question_type=q_data.question_type,
            options=[opt.model_dump() for opt in q_data.options] if q_data.options else None,
            correct_answer=q_data.correct_answer,
            explanation=q_data.explanation,
            points=q_data.points,
            difficulty=q_data.difficulty,
            tags=q_data.tags
        )
        db.add(question)
        imported += 1
    
    db.commit()
    
    return {"imported": imported, "message": f"Successfully imported {imported} questions"}


@router.post("/questions/upload-image")
async def upload_question_image(
    file: UploadFile = File(...),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Upload image for a question."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if file.filename else 'jpg'
    filename = f"{current_user.id}_{datetime.utcnow().timestamp()}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return {"url": f"/uploads/{filename}"}


# ==================== Quizzes ====================

@router.get("/quizzes", response_model=QuizListResponse)
async def list_quizzes(
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor),
    class_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all quizzes."""
    query = db.query(Quiz).filter(Quiz.instructor_id == current_user.id)
    
    if class_id:
        query = query.filter(Quiz.class_id == class_id)
    
    total = query.count()
    quizzes = query.offset(skip).limit(limit).all()
    
    result = []
    for q in quizzes:
        quiz_dict = {
            "id": q.id,
            "class_id": q.class_id,
            "instructor_id": q.instructor_id,
            "title": q.title,
            "description": q.description,
            "question_count": q.question_count,
            "time_limit_minutes": q.time_limit_minutes,
            "randomize_questions": q.randomize_questions,
            "randomize_options": q.randomize_options,
            "show_results": q.show_results,
            "show_explanations": q.show_explanations,
            "passing_score": q.passing_score,
            "max_attempts": q.max_attempts,
            "start_time": q.start_time,
            "end_time": q.end_time,
            "is_published": q.is_published,
            "pool_size": q.pool_size,
            "created_at": q.created_at
        }
        result.append(QuizResponse(**quiz_dict))
    
    return QuizListResponse(quizzes=result, total=total)


@router.post("/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Create a new quiz."""
    # Validate class ownership
    target_class = db.query(Class).filter(
        Class.id == data.class_id,
        Class.instructor_id == current_user.id
    ).first()
    
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    service = QuizService(db)
    quiz = service.create_quiz(
        instructor_id=current_user.id,
        **data.model_dump()
    )
    
    return QuizResponse(
        id=quiz.id,
        class_id=quiz.class_id,
        instructor_id=quiz.instructor_id,
        title=quiz.title,
        description=quiz.description,
        question_count=quiz.question_count,
        time_limit_minutes=quiz.time_limit_minutes,
        randomize_questions=quiz.randomize_questions,
        randomize_options=quiz.randomize_options,
        show_results=quiz.show_results,
        show_explanations=quiz.show_explanations,
        passing_score=quiz.passing_score,
        max_attempts=quiz.max_attempts,
        start_time=quiz.start_time,
        end_time=quiz.end_time,
        is_published=quiz.is_published,
        pool_size=quiz.pool_size,
        created_at=quiz.created_at
    )


@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Get quiz details."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.instructor_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return QuizResponse(
        id=quiz.id,
        class_id=quiz.class_id,
        instructor_id=quiz.instructor_id,
        title=quiz.title,
        description=quiz.description,
        question_count=quiz.question_count,
        time_limit_minutes=quiz.time_limit_minutes,
        randomize_questions=quiz.randomize_questions,
        randomize_options=quiz.randomize_options,
        show_results=quiz.show_results,
        show_explanations=quiz.show_explanations,
        passing_score=quiz.passing_score,
        max_attempts=quiz.max_attempts,
        start_time=quiz.start_time,
        end_time=quiz.end_time,
        is_published=quiz.is_published,
        pool_size=quiz.pool_size,
        created_at=quiz.created_at
    )


@router.put("/quizzes/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: UUID,
    data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Update quiz settings."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.instructor_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(quiz, field, value)
    
    quiz.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quiz)
    
    return QuizResponse(
        id=quiz.id,
        class_id=quiz.class_id,
        instructor_id=quiz.instructor_id,
        title=quiz.title,
        description=quiz.description,
        question_count=quiz.question_count,
        time_limit_minutes=quiz.time_limit_minutes,
        randomize_questions=quiz.randomize_questions,
        randomize_options=quiz.randomize_options,
        show_results=quiz.show_results,
        show_explanations=quiz.show_explanations,
        passing_score=quiz.passing_score,
        max_attempts=quiz.max_attempts,
        start_time=quiz.start_time,
        end_time=quiz.end_time,
        is_published=quiz.is_published,
        pool_size=quiz.pool_size,
        created_at=quiz.created_at
    )


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Delete a quiz."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.instructor_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()


@router.post("/quizzes/{quiz_id}/publish", response_model=QuizResponse)
async def publish_quiz(
    quiz_id: UUID,
    data: QuizPublish,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Publish or unpublish a quiz."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.instructor_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Validate pool size before publishing
    if data.is_published and quiz.pool_size < quiz.question_count:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish: Need at least {quiz.question_count} questions in pool, have {quiz.pool_size}"
        )
    
    quiz.is_published = data.is_published
    db.commit()
    db.refresh(quiz)
    
    return QuizResponse(
        id=quiz.id,
        class_id=quiz.class_id,
        instructor_id=quiz.instructor_id,
        title=quiz.title,
        description=quiz.description,
        question_count=quiz.question_count,
        time_limit_minutes=quiz.time_limit_minutes,
        randomize_questions=quiz.randomize_questions,
        randomize_options=quiz.randomize_options,
        show_results=quiz.show_results,
        show_explanations=quiz.show_explanations,
        passing_score=quiz.passing_score,
        max_attempts=quiz.max_attempts,
        start_time=quiz.start_time,
        end_time=quiz.end_time,
        is_published=quiz.is_published,
        pool_size=quiz.pool_size,
        created_at=quiz.created_at
    )


@router.post("/quizzes/{quiz_id}/add-questions", response_model=dict)
async def add_questions_to_quiz(
    quiz_id: UUID,
    data: AddQuestionsToQuiz,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Add questions to quiz pool."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.instructor_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Validate all questions belong to current instructor
    valid_questions = db.query(Question).filter(
        Question.id.in_(data.question_ids),
        Question.instructor_id == current_user.id,
        Question.is_active == True
    ).all()
    
    if len(valid_questions) != len(data.question_ids):
        raise HTTPException(
            status_code=400,
            detail="Some questions not found or don't belong to you"
        )
    
    service = QuizService(db)
    added = service.add_questions_to_pool(quiz_id, data.question_ids)
    
    return {"added": added, "pool_size": quiz.pool_size + added}


# ==================== Results ====================

@router.get("/quizzes/{quiz_id}/results")
async def get_quiz_results(
    quiz_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Get all results for a quiz."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.instructor_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    service = QuizService(db)
    results = service.get_quiz_results(quiz_id)
    
    return {
        "quiz_id": str(quiz_id),
        "quiz_title": quiz.title,
        "total_attempts": len(results),
        "results": results
    }


@router.get("/quizzes/{quiz_id}/export")
async def export_quiz_results(
    quiz_id: UUID,
    db: Session = Depends(get_db),
    current_user: Instructor = Depends(get_current_instructor)
):
    """Export quiz results as Excel file."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.instructor_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    service = QuizService(db)
    results = service.get_quiz_results(quiz_id)
    
    # Create Excel file
    excel_buffer = create_quiz_results_excel(
        quiz_title=quiz.title,
        class_name=quiz.class_.name if quiz.class_ else "Unknown",
        results=results
    )
    
    filename = f"quiz_results_{quiz.title.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d')}.xlsx"
    
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
