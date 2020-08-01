document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document
    .querySelector('#inbox')
    .addEventListener('click', () => loadMailbox('inbox'));

  document
    .querySelector('#sent')
    .addEventListener('click', () => loadMailbox('sent'));

  document
    .querySelector('#archived')
    .addEventListener('click', () => loadMailbox('archive'));

  document.querySelector('#compose').addEventListener('click', composeEmail);

  // By default, load the inbox
  loadMailbox('inbox');
});

function composeEmail() {
  document
    .querySelector('form')
    .addEventListener('submit', (submitEvent) => sendMail(submitEvent));

  // Show compose view and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function viewEmail(emailId) {
  let EMAIL;
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Clear messages before loading selected message
  document.querySelector('#email-view').innerHTML = '';

  // Mark as read
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    }),
  }).catch((error) => {
    console.log('Error:', error);
  });

  fetch(`/emails/${emailId}`)
    .then((response) => response.json())
    .then((data) => {
      EMAIL = data;
      const divEl = document.createElement('div');
      let buttonContainerEl = document.createElement('div');
      const unarchiveButton = `<button class="btn btn-danger" id="archive">Unarchive</button>`;
      const archiveButton = `<button class="btn btn-primary" id="archive">Archive</button>`;
      const replyButton = `<button class="btn btn-primary" id="reply">Reply</button>`;

      buttonContainerEl.innerHTML += replyButton;

      data.archived
        ? (buttonContainerEl.innerHTML += unarchiveButton)
        : (buttonContainerEl.innerHTML += archiveButton);

      divEl.className = 'message';
      divEl.innerHTML = `
        <p>From: ${data.sender}</p>
        <p>To: ${data.recipients.map(
          (recipient) => `<span> ${recipient}</span>`
        )}</p>
        <p>Subject: ${data.subject}</p>
        <p>Timestamp: ${data.timestamp}</p>
        <p>${data.body}</p>`;

      document.querySelector('#email-view').append(buttonContainerEl);
      document.querySelector('#email-view').append(divEl);

      document
        .querySelector('#reply')
        .addEventListener('click', (submitEvent) => reply(submitEvent, EMAIL));

      document
        .querySelector('#archive')
        .addEventListener('click', (submitEvent) =>
          toggleArchived(submitEvent, emailId, data.archived)
        );
    })
    .catch((error) => {
      console.log('Error:', error);
    });
}

function loadMailbox(mailbox) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#emails-view').innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((data) => {
      data.map((element) => {
        const divEl = document.createElement('div');
        divEl.className = 'inbox-message';

        element.read
          ? divEl.classList.add('read')
          : divEl.classList.add('unread');

        divEl.addEventListener('click', () => viewEmail(element.id));

        divEl.innerHTML = `
            <span>${element.sender}</span>
            <span>${element.subject}</span>
            <span>${element.timestamp}</span>
          `;
        document.querySelector('#emails-view').append(divEl);
      });
    })
    .catch((error) => {
      console.log('Error:', error);
    });
}

function sendMail(submitEvent) {
  submitEvent.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients,
      subject,
      body,
      read: false,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      loadMailbox('sent');
    })
    .catch((error) => {
      console.log('Error:', error);
    });
}

function toggleArchived(submitEvent, emailId, isArchived) {
  submitEvent.preventDefault();

  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !isArchived,
    }),
  })
    .then(() => {
      loadMailbox('inbox');
    })
    .catch((error) => {
      console.log('Error:', error);
    });
}

function reply(submitEvent, { subject, body, timestamp, sender }) {
  submitEvent.preventDefault();

  // If subject already starts with 'RE:' don't add more
  const replyRegex = /RE:/;
  const replySubject = replyRegex.test(subject.substring(0, 3))
    ? subject
    : `RE: ${subject}`;

  document
    .querySelector('form')
    .addEventListener('submit', (submitEvent) => sendMail(submitEvent));

  // Show compose view and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Pre-fill composition fields
  document.querySelector('#compose-recipients').value = sender;
  document.querySelector('#compose-subject').value = replySubject;
  document.querySelector(
    '#compose-body'
  ).value = `On ${timestamp} ${sender} wrote: ${body}`;
}
