const storedCards = localStorage.getItem('cards');
const cards = storedCards ? JSON.parse(storedCards) : [];

const template = document.getElementById('card-template');
const cardList = document.getElementById('card-list');

for (let i = 0; i < cards.length; i++) {
  let card = cards[i];

  const cardView = template.content.cloneNode(true);

  let titleText = cardView.querySelector('.title-text');
  let subtitleText = cardView.querySelector('.subtitle-text');
  let toText = cardView.querySelector('.to-text');
  let fromText = cardView.querySelector('.from-text');
  let messageText = cardView.querySelector('.message-text');
  const deleteBtn = cardView.querySelector('.delete-btn');

  titleText.dataset.index = i;
  subtitleText.dataset.index = i;
  toText.dataset.index = i;
  fromText.dataset.index = i;
  messageText.dataset.index = i;
  deleteBtn.dataset.index = i;

  titleText.textContent = card.title;
  subtitleText.textContent = card.subtitle;
  toText.textContent = card.to;
  fromText.textContent = card.from;
  messageText.textContent = card.message;

  deleteBtn.addEventListener('click', function (event) {
    const index = parseInt(event.target.dataset.index, 10);
    console.log(index);

    cards.splice(index, 1);
    localStorage.setItem('cards', JSON.stringify(cards));
    location.reload();
  });

  function updateCard(event) {
    const index = parseInt(event.target.dataset.index, 10);

    cards[index].title = titleText.textContent;
    cards[index].subtitle = subtitleText.textContent;
    cards[index].to = toText.textContent;
    cards[index].from = fromText.textContent;
    cards[index].message = messageText.textContent;

    localStorage.setItem('cards', JSON.stringify(cards));
  }

  titleText.addEventListener('input', updateCard);
  subtitleText.addEventListener('input', updateCard);
  toText.addEventListener('input', updateCard);
  fromText.addEventListener('input', updateCard);
  messageText.addEventListener('input', updateCard);

  cardList.appendChild(cardView);
}
