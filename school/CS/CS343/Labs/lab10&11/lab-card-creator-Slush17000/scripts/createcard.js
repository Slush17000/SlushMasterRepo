const toInput = document.getElementById('to-input');
const fromInput = document.getElementById('from-input');
const titleInput = document.getElementById('title-input');
const subtitleInput = document.getElementById('subtitle-input');
const messageInput = document.getElementById('message-input');

const previewBtn = document.getElementById('preview-btn');
const saveBtn = document.getElementById('save-btn');

const toText = document.querySelector('.to-text');
const fromText = document.querySelector('.from-text');
const titleText = document.querySelector('.title-text');
const subtitleText = document.querySelector('.subtitle-text');
const messageText = document.querySelector('.message-text');

previewBtn.addEventListener('click', () => {
  toText.textContent = toInput.value || 'RECIPIENT';
  fromText.textContent = fromInput.value || 'SENDER';
  titleText.textContent = titleInput.value || 'TITLE';
  subtitleText.textContent = subtitleInput.value || 'SUBTITLE';
  messageText.textContent = messageInput.value || 'YOUR MESSAGE HERE';
});

saveBtn.addEventListener('click', (event) => {
  event.preventDefault();

  const storedCards = localStorage.getItem('cards');
  let cards = storedCards ? JSON.parse(storedCards) : [];

  const newCard = {
    to: toInput.value,
    from: fromInput.value,
    title: titleInput.value,
    subtitle: subtitleInput.value,
    message: messageInput.value
  };

  cards.push(newCard);
  localStorage.setItem('cards', JSON.stringify(cards));

  alert('Card saved');
  document.querySelector('.card-form').reset();
});
