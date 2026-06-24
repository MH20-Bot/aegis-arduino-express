import {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  apiRequest
} from '../services/api.js';

const emptyForm = {
  name: '',
  relationship: '',
  phone: '',
  email: '',
  priority: 1,
  preferredMethod: 'SHARE',
  allowLocation: true,
  allowHealthSummary: false,
  isActive: true
};

function EmergencyContacts() {
  const [
    contacts,
    setContacts
  ] = useState([]);

  const [
    form,
    setForm
  ] = useState(
    emptyForm
  );

  const [
    editingId,
    setEditingId
  ] = useState('');

  const [
    busy,
    setBusy
  ] = useState(false);

  const [
    message,
    setMessage
  ] = useState('');

  const [
    error,
    setError
  ] = useState('');

  const loadContacts =
    useCallback(
      async () => {
        try {
          const result =
            await apiRequest(
              '/api/emergency-network/contacts'
            );

          setContacts(
            result.contacts ||
            []
          );

          setError('');
        } catch (
          requestError
        ) {
          setError(
            requestError.message
          );
        }
      },
      []
    );

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  function updateField(
    event
  ) {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setForm(
      previous => ({
        ...previous,

        [name]:
          type ===
          'checkbox'
            ? checked
            : value
      })
    );
  }

  function editContact(
    contact
  ) {
    setEditingId(
      contact._id
    );

    setForm({
      name:
        contact.name ||
        '',

      relationship:
        contact.relationship ||
        '',

      phone:
        contact.phone ||
        '',

      email:
        contact.email ||
        '',

      priority:
        contact.priority ||
        1,

      preferredMethod:
        contact
          .preferredMethod ||
        'SHARE',

      allowLocation:
        contact
          .allowLocation !==
        false,

      allowHealthSummary:
        contact
          .allowHealthSummary ===
        true,

      isActive:
        contact.isActive !==
        false
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function resetForm() {
    setEditingId('');
    setForm(emptyForm);
  }

  async function saveContact(
    event
  ) {
    event.preventDefault();

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const path =
        editingId
          ? `/api/emergency-network/contacts/${editingId}`
          : '/api/emergency-network/contacts';

      const result =
        await apiRequest(
          path,
          {
            method:
              editingId
                ? 'PATCH'
                : 'POST',

            body:
              JSON.stringify({
                ...form,

                priority:
                  Number(
                    form.priority
                  )
              })
          }
        );

      setMessage(
        result.message
      );

      resetForm();

      await loadContacts();
    } catch (
      requestError
    ) {
      setError(
        requestError.message
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeContact(
    contactId
  ) {
    const confirmed =
      window.confirm(
        'Delete this emergency contact?'
      );

    if (!confirmed) {
      return;
    }

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const result =
        await apiRequest(
          `/api/emergency-network/contacts/${contactId}`,
          {
            method: 'DELETE'
          }
        );

      setMessage(
        result.message
      );

      await loadContacts();
    } catch (
      requestError
    ) {
      setError(
        requestError.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="network-page-hero">
        <div className="network-container">
          <span className="network-kicker">
            Trusted Contact Network
          </span>

          <h1>
            Emergency Contacts
          </h1>

          <p>
            Add trusted people who can
            receive a secure emergency
            response link, location details,
            and a limited incident summary.
          </p>

          <Link
            to="/app/features/emergency-alerts"
            className="network-secondary-button"
          >
            Return to Emergency Alerts
          </Link>
        </div>
      </section>

      <section className="network-section">
        <div className="network-container network-two-column">
          <form
            className="network-card network-form"
            onSubmit={
              saveContact
            }
          >
            <h2>
              {editingId
                ? 'Edit Contact'
                : 'Add Contact'}
            </h2>

            <label>
              Full Name

              <input
                name="name"
                value={form.name}
                onChange={
                  updateField
                }
                required
              />
            </label>

            <label>
              Relationship

              <input
                name="relationship"
                value={
                  form.relationship
                }
                onChange={
                  updateField
                }
                placeholder="Parent, sibling, doctor, caregiver"
                required
              />
            </label>

            <div className="network-form-grid">
              <label>
                Phone

                <input
                  name="phone"
                  value={
                    form.phone
                  }
                  onChange={
                    updateField
                  }
                  placeholder="+92..."
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  name="email"
                  value={
                    form.email
                  }
                  onChange={
                    updateField
                  }
                />
              </label>
            </div>

            <div className="network-form-grid">
              <label>
                Priority

                <select
                  name="priority"
                  value={
                    form.priority
                  }
                  onChange={
                    updateField
                  }
                >
                  <option value="1">
                    Priority 1
                  </option>

                  <option value="2">
                    Priority 2
                  </option>

                  <option value="3">
                    Priority 3
                  </option>

                  <option value="4">
                    Priority 4
                  </option>

                  <option value="5">
                    Priority 5
                  </option>
                </select>
              </label>

              <label>
                Preferred Method

                <select
                  name="preferredMethod"
                  value={
                    form
                      .preferredMethod
                  }
                  onChange={
                    updateField
                  }
                >
                  <option value="SHARE">
                    Share Link
                  </option>

                  <option value="CALL">
                    Call
                  </option>

                  <option value="EMAIL">
                    Email
                  </option>
                </select>
              </label>
            </div>

            <label className="network-checkbox">
              <input
                type="checkbox"
                name="allowLocation"
                checked={
                  form
                    .allowLocation
                }
                onChange={
                  updateField
                }
              />

              Allow location sharing
            </label>

            <label className="network-checkbox">
              <input
                type="checkbox"
                name="allowHealthSummary"
                checked={
                  form
                    .allowHealthSummary
                }
                onChange={
                  updateField
                }
              />

              Allow limited health summary sharing
            </label>

            <label className="network-checkbox">
              <input
                type="checkbox"
                name="isActive"
                checked={
                  form.isActive
                }
                onChange={
                  updateField
                }
              />

              Contact is active
            </label>

            <div className="network-button-row">
              <button
                type="submit"
                className="network-primary-button"
                disabled={busy}
              >
                {busy
                  ? 'Saving...'
                  : editingId
                    ? 'Update Contact'
                    : 'Add Contact'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="network-secondary-button"
                  onClick={
                    resetForm
                  }
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {message && (
              <div className="network-message success">
                {message}
              </div>
            )}

            {error && (
              <div className="network-message error">
                {error}
              </div>
            )}
          </form>

          <div>
            <div className="network-section-heading">
              <h2>
                Saved Contacts
              </h2>

              <span>
                {contacts.length}{' '}
                contacts
              </span>
            </div>

            {contacts.length ===
            0 ? (
              <div className="network-card network-empty">
                No emergency contacts have
                been added.
              </div>
            ) : (
              <div className="network-contact-list">
                {contacts.map(
                  contact => (
                    <article
                      key={
                        contact._id
                      }
                      className="network-card network-contact-card"
                    >
                      <div>
                        <span className="network-priority">
                          Priority{' '}
                          {
                            contact.priority
                          }
                        </span>

                        <h3>
                          {contact.name}
                        </h3>

                        <p>
                          {
                            contact.relationship
                          }
                        </p>
                      </div>

                      <dl>
                        <div>
                          <dt>
                            Phone
                          </dt>

                          <dd>
                            {contact.phone ||
                              'Not provided'}
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Email
                          </dt>

                          <dd>
                            {contact.email ||
                              'Not provided'}
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Location
                          </dt>

                          <dd>
                            {contact
                              .allowLocation
                              ? 'Allowed'
                              : 'Not allowed'}
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Status
                          </dt>

                          <dd>
                            {contact
                              .isActive
                              ? 'Active'
                              : 'Inactive'}
                          </dd>
                        </div>
                      </dl>

                      <div className="network-button-row">
                        <button
                          type="button"
                          className="network-secondary-button"
                          onClick={() =>
                            editContact(
                              contact
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="network-danger-button"
                          onClick={() =>
                            removeContact(
                              contact._id
                            )
                          }
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default EmergencyContacts;