const VIEWS = {
  EMAIL_VIEW: '#email-view',
  EMAILS_VIEW: '#emails-view',
  COMPOSE_VIEW: '#compose-view',
};

const SELECTORS = {
  COMPOSE_RECIPIENTS: '#compose-recipients',
  COMPOSE_SUBJECT: '#compose-subject',
  COMPOSE_BODY: '#compose-body',
};

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
    .addEventListener('click', () => loadMailbox('archived'));

  document.querySelector('#compose').addEventListener('click', composeEmail);

  // register submit event listener
  document
    .querySelector('form')
    .addEventListener('submit', (submitEvent) => sendMail(submitEvent));

  // By default, load the inbox
  loadMailbox('inbox');
});

function composeEmail() {
  show(VIEWS.COMPOSE_VIEW);

  // Clear out composition fields
  document.querySelector(SELECTORS.COMPOSE_RECIPIENTS).value = '';
  document.querySelector(SELECTORS.COMPOSE_SUBJECT).value = '';
  document.querySelector(SELECTORS.COMPOSE_BODY).value = '';
}

function viewEmail(emailId) {
  show(VIEWS.EMAIL_VIEW);
  document.querySelector(VIEWS.EMAIL_VIEW).innerHTML = '';

  const userEmail = JSON.parse(
    document.getElementById('userEmail').textContent
  );

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
      const divEl = document.createElement('div');
      let buttonContainerEl = document.createElement('div');
      buttonContainerEl.className = 'button-container';
      const unarchiveButton = `<button class="btn btn-danger" id="archive">Unarchive</button>`;
      const archiveButton = `<button class="btn btn-primary" id="archive">Archive</button>`;
      const replyButton = `<button class="btn btn-primary" id="reply">Reply</button>`;

      buttonContainerEl.innerHTML += replyButton;

      // only add toggle archive button if user is not sender (can't archive own)
      if (data.sender !== userEmail) {
        if (data.archived) {
          buttonContainerEl.innerHTML += unarchiveButton;
        } else {
          buttonContainerEl.innerHTML += archiveButton;
        }
      }

      divEl.className = 'message';
      divEl.innerHTML = `
      <div class="card">
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
          <p>From: ${data.sender}</p>
          <p>To: ${data.recipients.map(
            (recipient) => `<span>${recipient}</span>`
          )}</p>
          <p><small class="text-muted">${data.timestamp}</small></p>
          </li>
          </li>
          <li class="list-group-item">Subject: ${data.subject}</li>
        </ul>
        <div class="card-body">
          <p class="card-text">${data.body}</p>
        </div>
      </div>`;

      document.querySelector(VIEWS.EMAIL_VIEW).append(buttonContainerEl);
      document.querySelector(VIEWS.EMAIL_VIEW).append(divEl);

      document
        .querySelector('#reply')
        .addEventListener('click', (submitEvent) => reply(submitEvent, data));

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
  console.log(mailbox);
  show(VIEWS.EMAILS_VIEW);
  if (mailbox === 'sent') {
    document.querySelector(VIEWS.EMAILS_VIEW).innerHTML = `
  <div>
        <h3 id="emails-view-title"></h3>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">To</th>
                    <th scope="col">Subject</th>
                    <th scope="col">Time</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    </div>
  `;
  } else {
    document.querySelector(VIEWS.EMAILS_VIEW).innerHTML = `
  <div>
        <h3 id="emails-view-title"></h3>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">From</th>
                    <th scope="col">Subject</th>
                    <th scope="col">Time</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    </div>
  `;
  }

  // remove active state in navbar when mailbox link is clicked and only make current one active
  document
    .querySelectorAll('.active')
    .forEach((el) => el.classList.remove('active'));
  document.querySelector(`#${mailbox}`).classList.add('active');

  document.querySelector('#emails-view-title').innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((data) => {
      data.map((element) => {
        const tableRowEl = document.createElement('tr');

        element.read
          ? tableRowEl.classList.add('table-dark')
          : tableRowEl.classList.add('table-light');

        tableRowEl.addEventListener('click', () => viewEmail(element.id));
        if (mailbox === 'sent') {
          tableRowEl.innerHTML = `
            <td>${element.sender}</td>
            <td>${element.recipients.map(
              (recipient) => `<span>${recipient}</span>`
            )}</td>
            <td>${element.subject}</td>
            <td>${element.timestamp}</td>
            `;
        } else {
          tableRowEl.innerHTML = `
            <td>${element.sender}</td>
            <td>${element.subject}</td>
            <td>${element.timestamp}</td>
            `;
        }

        document
          .querySelector('#emails-view > div > table > tbody')
          .append(tableRowEl);
      });
    })
    .catch((error) => {
      console.log('Error:', error);
    });
}

function sendMail(submitEvent) {
  submitEvent.preventDefault();

  const recipients = document.querySelector(SELECTORS.COMPOSE_RECIPIENTS).value;
  const subject = document.querySelector(SELECTORS.COMPOSE_SUBJECT).value;
  const body = document.querySelector(SELECTORS.COMPOSE_BODY).value;

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
  show(VIEWS.COMPOSE_VIEW);

  // If subject already starts with 'RE:' don't add more
  const replyRegex = /RE:/;
  const replySubject = replyRegex.test(subject.substring(0, 3))
    ? subject
    : `RE: ${subject}`;

  // Pre-fill composition fields
  document.querySelector(SELECTORS.COMPOSE_RECIPIENTS).value = sender;
  document.querySelector(SELECTORS.COMPOSE_SUBJECT).value = replySubject;
  document.querySelector(
    SELECTORS.COMPOSE_BODY
  ).value = `On: ${timestamp}\n${sender} wrote: \n${body}\n${'* '.repeat(12)}
  `;
}

function show(selector) {
  Object.keys(VIEWS).forEach((key) => {
    VIEWS[key] === selector
      ? (document.querySelector(VIEWS[key]).style.display = 'block')
      : (document.querySelector(VIEWS[key]).style.display = 'none');
  });
}
