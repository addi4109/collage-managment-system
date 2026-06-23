import ExamAttempt from '../models/ExamAttempt.js';
import ProctorLog from '../models/ProctorLog.js';
import Question from '../models/Question.js';

export const logProctorEvent = async (req, res) => {
  const { examId, eventType, severity } = req.body;

  if (!examId || !eventType || !severity) {
    return res.status(400).json({ message: 'ExamId, eventType, and severity are required.' });
  }

  try {
    const attempt = await ExamAttempt.findOne({ examId, studentId: req.user.id });
    if (!attempt) {
      return res.status(404).json({ message: 'No active exam attempt found for this student.' });
    }

    if (attempt.status !== 'active') {
      return res.status(400).json({ message: 'Exam attempt is not currently active.' });
    }

    const logEntry = new ProctorLog({
      studentId: req.user.id,
      examId,
      eventType,
      severity,
      timestamp: new Date(),
    });

    await logEntry.save();
    res.status(201).json({ success: true, message: 'Proctoring event logged successfully.' });
  } catch (error) {
    console.error('Log proctor event error:', error);
    res.status(500).json({ message: 'Internal server error logging event.' });
  }
};

export const incrementWarning = async (req, res) => {
  const { examId, eventType, severity, answers } = req.body;

  if (!examId) {
    return res.status(400).json({ message: 'ExamId is required.' });
  }

  try {
    const attempt = await ExamAttempt.findOne({ examId, studentId: req.user.id });
    if (!attempt) {
      return res.status(404).json({ message: 'No active exam attempt found.' });
    }

    if (attempt.status !== 'active') {
      return res.status(400).json({ message: 'Exam attempt is already finalized or blocked.' });
    }

    // Log the event
    if (eventType) {
      const logEntry = new ProctorLog({
        studentId: req.user.id,
        examId,
        eventType,
        severity: severity || 'medium',
        timestamp: new Date(),
      });
      await logEntry.save();
    }

    attempt.warnings += 1;
    let blocked = false;

    if (attempt.warnings >= 3) {
      attempt.status = 'blocked';
      attempt.endTime = new Date();
      blocked = true;

      // Auto Evaluate answers submitted so far
      if (answers && Array.isArray(answers)) {
        const questions = await Question.find({ examId });
        let score = 0;

        const formattedAnswers = answers.map((ans) => {
          const question = questions.find((q) => q._id.toString() === ans.questionId);
          if (question && question.correctAnswer.trim().toLowerCase() === ans.selectedAnswer.trim().toLowerCase()) {
            score += question.marks;
          }
          return {
            questionId: ans.questionId,
            selectedAnswer: ans.selectedAnswer,
          };
        });

        attempt.answers = formattedAnswers;
        attempt.score = score;
      }
    }

    await attempt.save();

    res.json({
      success: true,
      warnings: attempt.warnings,
      blocked,
      message: blocked
        ? 'You have been blocked from the exam due to multiple proctor violations. Your answers so far have been auto-submitted.'
        : `Warning count increased: ${attempt.warnings}/3. Please stay focused on the exam.`,
    });
  } catch (error) {
    console.error('Increment warning error:', error);
    res.status(500).json({ message: 'Internal server error updating warnings.' });
  }
};

export const blockStudent = async (req, res) => {
  const { examId, studentId, answers } = req.body;

  if (!examId || !studentId) {
    return res.status(400).json({ message: 'ExamId and studentId are required.' });
  }

  try {
    const attempt = await ExamAttempt.findOne({ examId, studentId });
    if (!attempt) {
      return res.status(404).json({ message: 'No attempt found for this student.' });
    }

    attempt.status = 'blocked';
    attempt.endTime = new Date();

    if (answers && Array.isArray(answers)) {
      const questions = await Question.find({ examId });
      let score = 0;

      const formattedAnswers = answers.map((ans) => {
        const question = questions.find((q) => q._id.toString() === ans.questionId);
        if (question && question.correctAnswer.trim().toLowerCase() === ans.selectedAnswer.trim().toLowerCase()) {
          score += question.marks;
        }
        return {
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer,
        };
      });

      attempt.answers = formattedAnswers;
      attempt.score = score;
    }

    await attempt.save();
    res.json({ success: true, message: 'Student successfully blocked.' });
  } catch (error) {
    console.error('Block student error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
