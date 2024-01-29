document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch quiz questions from backend
        const response = await fetch('/quiz_questions');
        if (!response.ok) {
            throw new Error('Failed to fetch quiz questions.');
        }
        const { quizQuestions } = await response.json();

        // Get the quizQuestions div
        const quizQuestionsDiv = document.getElementById('quizQuestions');

        // Loop through quizQuestions and create HTML elements to display each question
        quizQuestions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.innerHTML = `
        <h3>Question ${index + 1}:</h3>
        <p>${question.questionText}</p>
        <ul>
          ${question.options.map(option => `<li>${option}</li>`).join('')}
        </ul>
      `;
            quizQuestionsDiv.appendChild(questionDiv);
        });
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
    }
});
