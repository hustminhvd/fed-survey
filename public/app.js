const form = document.getElementById('survey-form');
const message = document.getElementById('message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.className = 'message';
  message.textContent = '';

  const studentName = document.getElementById('studentName').value.trim();
  const studentId = document.getElementById('studentId').value.trim();
  const studentEmail = document.getElementById('studentEmail').value.trim();
  const studentMajor = document.getElementById('studentMajor').value;
  const studentClass = document.getElementById('studentClass').value;

  try {
    const response = await fetch('/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentName,
        studentId,
        studentEmail,
        studentMajor,
        studentClass,
      }),
    });

    const result = await response.json();

    if (result.success) {
      message.classList.add('success');
      message.textContent = result.message;
      form.reset();
    } else {
      message.classList.add('error');
      message.textContent = result.message || 'Đã có lỗi xảy ra.';
    }
  } catch (error) {
    message.classList.add('error');
    message.textContent = 'Không thể gửi khảo sát. Vui lòng thử lại.';
  }
});
