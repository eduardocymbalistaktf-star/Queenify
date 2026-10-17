
CREATE POLICY "Course owner views student progress"
ON public.student_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = student_progress.lesson_id
      AND c.user_id = auth.uid()
  )
);
