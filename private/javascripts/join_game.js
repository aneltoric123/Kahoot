document.addEventListener('DOMContentLoaded', () => {
    const joinGameForm = document.getElementById('joinGameForm');
    joinGameForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const gameCodeInput = document.getElementById('gameCode');
        const gameCode = gameCodeInput.value.trim();

        if (gameCode === '') {
            alert('Please enter a game code.');
            return;
        }

        try {

            const response = await fetch('/create_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gameCode })
            });

            if (!response.ok) {
                throw new Error('Failed to join game.');
            }


            window.location.href = `/quiz_interface?gameCode=${gameCode}`;
        } catch (error) {
            console.error('Error joining game:', error);
            alert('Failed to join game. Please try again.');
        }
    });
});