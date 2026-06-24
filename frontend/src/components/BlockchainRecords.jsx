
import {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  apiRequest
} from '../services/api.js';

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  return new Date(
    value
  ).toLocaleString();
}

function shortenHash(value) {
  if (!value) {
    return 'Not available';
  }

  const hash =
    String(value);

  if (hash.length <= 30) {
    return hash;
  }

  return `${hash.slice(0, 14)}...${hash.slice(-10)}`;
}

function normalizeLevel(value) {
  return String(
    value || 'COMPLETED'
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function BlockchainRecords() {
  const [
    records,
    setRecords
  ] = useState([]);

  const [
    verification,
    setVerification
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    busyAction,
    setBusyAction
  ] = useState('');

  const [
    message,
    setMessage
  ] = useState('');

  const [
    error,
    setError
  ] = useState('');

  const loadRecords =
    useCallback(
      async () => {
        try {
          const result =
            await apiRequest(
              '/api/blockchain-records'
            );

          setRecords(
            Array.isArray(
              result.records
            )
              ? result.records
              : []
          );
        } catch (
          requestError
        ) {
          setError(
            requestError.message ||
            'Blockchain records could not be loaded.'
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  async function createRecord() {
    setBusyAction(
      'create'
    );

    setMessage('');
    setError('');
    setVerification(null);

    try {
      const result =
        await apiRequest(
          '/api/blockchain-records/create',
          {
            method:
              'POST'
          }
        );

      setMessage(
        result.message ||
        'The latest health result was added to the cryptographic chain.'
      );

      await loadRecords();
    } catch (
      requestError
    ) {
      setError(
        requestError.message ||
        'The blockchain record could not be created.'
      );
    } finally {
      setBusyAction('');
    }
  }

  async function verifyChain() {
    setBusyAction(
      'verify'
    );

    setMessage('');
    setError('');

    try {
      const result =
        await apiRequest(
          '/api/blockchain-records/verify'
        );

      const verificationResult =
        result.verification ||
        null;

      setVerification(
        verificationResult
      );

      if (
        verificationResult?.valid
      ) {
        setMessage(
          'Every cryptographic record is valid.'
        );
      } else {
        setMessage(
          'The cryptographic chain contains verification issues.'
        );
      }
    } catch (
      requestError
    ) {
      setError(
        requestError.message ||
        'The cryptographic chain could not be verified.'
      );
    } finally {
      setBusyAction('');
    }
  }

  const verificationIssues =
    Array.isArray(
      verification?.issues
    )
      ? verification.issues
      : [];

  return (
    <>
      <section className="nextgen-hero blockchain-theme">
        <div className="nextgen-container">
          <span className="nextgen-kicker">
            Cryptographic Health Audit
          </span>

          <h1>
            Blockchain Records
          </h1>

          <p>
            Convert completed AEGIS feature results into a tamper evident cryptographic chain. Each record is connected to the previous record so unexpected changes can be detected.
          </p>
        </div>
      </section>

      <section className="nextgen-section">
        <div className="nextgen-container">
          <div className="nextgen-two-column">
            <section className="nextgen-card">
              <span className="nextgen-kicker">
                Create Record
              </span>

              <h2>
                Protect the Latest Health Result
              </h2>

              <p>
                The latest completed AEGIS feature result will be converted into a SHA 256 hash and connected to the existing record chain.
              </p>

              <button
                type="button"
                className="nextgen-primary-button"
                disabled={
                  Boolean(
                    busyAction
                  )
                }
                onClick={
                  createRecord
                }
              >
                {busyAction ===
                'create'
                  ? 'Creating Record...'
                  : 'Add Latest Result to Chain'}
              </button>
            </section>

            <section className="nextgen-card">
              <span className="nextgen-kicker">
                Verify Integrity
              </span>

              <h2>
                Check the Full Chain
              </h2>

              <p>
                Verification recalculates every payload hash, record hash, sequence number, and previous record connection.
              </p>

              <button
                type="button"
                className="nextgen-secondary-button"
                disabled={
                  Boolean(
                    busyAction
                  )
                }
                onClick={
                  verifyChain
                }
              >
                {busyAction ===
                'verify'
                  ? 'Verifying Records...'
                  : 'Verify All Records'}
              </button>

              {verification && (
                <div
                  className={`nextgen-verification ${
                    verification.valid
                      ? 'valid'
                      : 'invalid'
                  }`}
                >
                  <strong>
                    {verification.valid
                      ? 'CHAIN VALID'
                      : 'CHAIN INVALID'}
                  </strong>

                  <span>
                    {verification.totalRecords ??
                      records.length}{' '}
                    records checked
                  </span>
                </div>
              )}
            </section>
          </div>

          <section className="nextgen-card">
            <div className="nextgen-heading-row">
              <div>
                <span className="nextgen-kicker">
                  Tamper Evident Timeline
                </span>

                <h2>
                  Health Record Chain
                </h2>
              </div>

              <span>
                {records.length}{' '}
                records
              </span>
            </div>

            {loading ? (
              <div className="nextgen-empty">
                Loading blockchain records...
              </div>
            ) : records.length ===
              0 ? (
              <div className="nextgen-empty">
                Complete another AEGIS feature, then create the first blockchain record.
              </div>
            ) : (
              <div className="blockchain-list">
                {records.map(
                  record => {
                    const recordLevel =
                      normalizeLevel(
                        record.level
                      );

                    return (
                      <article
                        className="blockchain-record"
                        key={
                          record._id ||
                          `${record.sequence}-${record.recordHash}`
                        }
                      >
                        <div className="blockchain-sequence">
                          #
                          {record.sequence ??
                            0}
                        </div>

                        <div className="blockchain-record-content">
                          <div className="nextgen-heading-row">
                            <div>
                              <strong>
                                {record.featureName ||
                                  record.sourceFeatureSlug ||
                                  'Health Record'}
                              </strong>

                              <span>
                                {formatDate(
                                  record.eventAt ||
                                  record.createdAt
                                )}
                              </span>
                            </div>

                            <span
                              className={`nextgen-level ${recordLevel}`}
                            >
                              {record.level ||
                                'COMPLETED'}
                            </span>
                          </div>

                          <p>
                            {record.summary ||
                              'A completed feature result was added to the cryptographic chain.'}
                          </p>

                          <dl className="blockchain-hashes">
                            <div>
                              <dt>
                                Previous Hash
                              </dt>

                              <dd
                                title={
                                  record.previousHash ||
                                  ''
                                }
                              >
                                {shortenHash(
                                  record.previousHash
                                )}
                              </dd>
                            </div>

                            <div>
                              <dt>
                                Payload Hash
                              </dt>

                              <dd
                                title={
                                  record.payloadHash ||
                                  ''
                                }
                              >
                                {shortenHash(
                                  record.payloadHash
                                )}
                              </dd>
                            </div>

                            <div>
                              <dt>
                                Record Hash
                              </dt>

                              <dd
                                title={
                                  record.recordHash ||
                                  ''
                                }
                              >
                                {shortenHash(
                                  record.recordHash
                                )}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {verification &&
            !verification.valid &&
            verificationIssues.length >
              0 && (
              <section className="nextgen-card">
                <span className="nextgen-kicker">
                  Verification Problems
                </span>

                <h2>
                  Chain Issues
                </h2>

                <div className="assistant-action-list">
                  {verificationIssues.map(
                    (
                      issue,
                      index
                    ) => (
                      <div
                        key={`${issue.sequence}-${index}`}
                      >
                        Record #
                        {issue.sequence ??
                          'Unknown'}
                        :{' '}
                        {issue.message ||
                          'An integrity issue was detected.'}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

          {message && (
            <div className="nextgen-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="nextgen-message error">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="nextgen-warning">
        <div className="nextgen-container">
          This prototype uses a private cryptographic hash chain. It does not publish personal health information to a public cryptocurrency network.
        </div>
      </section>
    </>
  );
}

export default BlockchainRecords;

