import {
  useEffect,
  useState
} from 'react';

import {
  useParams
} from 'react-router-dom';

const API_URL =
  import.meta.env
    .VITE_API_URL ||
  'http://localhost:5000';

async function publicRequest(
  path,
  options = {}
) {
  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,

        headers: {
          Accept:
            'application/json',

          ...(options.body
            ? {
                'Content-Type':
                  'application/json'
              }
            : {}),

          ...options.headers
        }
      }
    );

  const result =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Emergency response information could not be loaded.'
    );
  }

  return result;
}

function EmergencyResponse() {
  const { token } =
    useParams();

  const [
    emergency,
    setEmergency
  ] = useState(null);

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

  useEffect(() => {
    async function loadEmergency() {
      try {
        const result =
          await publicRequest(
            `/api/emergency-response/${token}`
          );

        setEmergency(
          result.emergency
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      }
    }

    loadEmergency();
  }, [token]);

  async function acknowledge(
    responseValue
  ) {
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const result =
        await publicRequest(
          `/api/emergency-response/${token}/acknowledge`,
          {
            method: 'POST',

            body:
              JSON.stringify({
                response:
                  responseValue
              })
          }
        );

      setMessage(
        result.message
      );

      setEmergency(
        previous => ({
          ...previous,

          contact: {
            ...previous.contact,

            response:
              responseValue,

            status:
              responseValue ===
              'RESPONDING'
                ? 'ACKNOWLEDGED'
                : 'DECLINED'
          }
        })
      );
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

  if (
    error &&
    !emergency
  ) {
    return (
      <section className="network-public-page">
        <div className="network-public-card">
          <span className="network-kicker">
            Emergency Response
          </span>

          <h1>
            Link Unavailable
          </h1>

          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!emergency) {
    return (
      <section className="network-public-page">
        <div className="network-public-card">
          <h1>
            Loading Emergency Information
          </h1>
        </div>
      </section>
    );
  }

  return (
    <section className="network-public-page">
      <div className="network-public-card">
        <span className="network-kicker">
          Secure Emergency Response
        </span>

        <h1>
          {emergency.userName}{' '}
          Needs Assistance
        </h1>

        <div
          className={`network-level-banner ${emergency.level.toLowerCase()}`}
        >
          Current Alert Level:{' '}
          {emergency.level}
        </div>

        <dl className="network-public-details">
          <div>
            <dt>
              Incident Status
            </dt>

            <dd>
              {emergency.status}
            </dd>
          </div>

          <div>
            <dt>Started</dt>

            <dd>
              {new Date(
                emergency.startedAt
              ).toLocaleString()}
            </dd>
          </div>

          <div>
            <dt>Hardware</dt>

            <dd>
              {emergency
                .hardwareConfirmed
                ? 'Arduino confirmed'
                : 'Not confirmed'}
            </dd>
          </div>

          <div>
            <dt>
              Your Contact Status
            </dt>

            <dd>
              {
                emergency.contact
                  .status
              }
            </dd>
          </div>
        </dl>

        {emergency.note && (
          <div className="network-note">
            <strong>
              Incident Note
            </strong>

            <p>
              {emergency.note}
            </p>
          </div>
        )}

        {emergency.location
          ?.mapUrl && (
          <a
            className="network-primary-button network-map-link"
            href={
              emergency.location
                .mapUrl
            }
            target="_blank"
            rel="noreferrer"
          >
            Open Location in Maps
          </a>
        )}

        <div className="network-response-actions">
          <button
            type="button"
            className="network-primary-button"
            disabled={busy}
            onClick={() =>
              acknowledge(
                'RESPONDING'
              )
            }
          >
            I Am Responding
          </button>

          <button
            type="button"
            className="network-danger-button"
            disabled={busy}
            onClick={() =>
              acknowledge(
                'CANNOT_RESPOND'
              )
            }
          >
            I Cannot Respond
          </button>
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

        <p className="network-public-warning">
          This page does not contact official
          emergency services. Contact the user
          and local emergency services directly
          when immediate assistance is required.
        </p>
      </div>
    </section>
  );
}

export default EmergencyResponse;