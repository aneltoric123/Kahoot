document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const quizResultsContainer = document.getElementById('quizResults');

    socket.on('quizResults', (results) => {
        quizResultsContainer.innerHTML = ''; // Clear previous results
        results.forEach((result, index) => {
            const resultElement = document.createElement('div');
            resultElement.innerHTML = `<p>${index + 1}. ${result}</p>`;
            quizResultsContainer.appendChild(resultElement);
        });
    });
});
