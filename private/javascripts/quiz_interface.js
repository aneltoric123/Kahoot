document.addEventListener("DOMContentLoaded", function() {

    fetch('/api/quiz/questions')
        .then(response => response.json())
        .then(questions => displayQuestions(questions))
        .catch(error => console.error('Error fetching quiz questions:', error));


    function displayQuestions(questions) {
        const quizQuestionsDiv = document.getElementById('quizQuestions');
        questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.innerHTML = `
                <h3>Question ${index + 1}:</h3>
                <p>${question.text}</p>
                <ul>
                    ${question.options.map((option, i) => `<li><input type="radio" id="option${i}" name="answer" value="${i}"><label for="option${i}">${option}</label></li>`).join('')}
                </ul>
            `;
            quizQuestionsDiv.appendChild(questionDiv);
        });
    }


    const quizForm = document.getElementById('quizForm');
    quizForm.addEventListener('submit', function(event) {
        event.preventDefault();


        const selectedOption = document.querySelector('input[name="answer"]:checked');
        if (!selectedOption) {
            alert('Please select an answer.');
            return;
        }

        const answerIndex = selectedOption.value;


        fetch('/api/quiz/submit-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answerIndex })
        })
            .then(response => {
                if (response.ok) {

                    alert('Answer submitted successfully!');
                } else {

                    alert('Failed to submit answer.');
                }
            })
            .catch(error => console.error('Error submitting answer:', error));
    });
});