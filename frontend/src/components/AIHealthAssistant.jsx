
import {
  useState
} from 'react';

import {
  apiRequest
} from '../services/api.js';

function AIHealthAssistant() {
  const [
    report,
    setReport
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    message,
    setMessage
  ] = useState('');

  const [
    error,
    setError
  ] = useState('');

  async function createHealthReport() {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const result =
        await apiRequest(
          '/api/ai-health-assistant/analyze',
          {
            method: 'POST'
          }
        );

      setReport(
        result.report || null
      );

      setMessage(
        result.message ||
        'The combined health report was created successfully.'
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        'The combined health report could not be created.'
      );
    } finally {
      setLoading(false);
    }
  }

  const reportLevel =
    String(
      report?.level ||
      'GOOD'
    ).toLowerCase();

  const sources =
    Array.isArray(
      report?.sources
    )
      ? report.sources
      : [];

  const actions =
    Array.isArray(
      report?.actions
    )
      ? report.actions
      : [];

  return (
    <>
      <section className="nextgen-hero assistant-theme">
        <div className="nextgen-container">
          <span className="nextgen-kicker">
            Unified Health Decision Engine
          </span>

          <h1>
            AI Health Assistant
          </h1>

          <p>
            Combine recent AEGIS feature results into one health monitoring summary.
          </p>
        </div>
      </section>

      <section className="nextgen-section">
        <div className="nextgen-container">
          <section className="nextgen-card assistant-start-card">
            <span className="nextgen-kicker">
              Combined Analysis
            </span>

            <h2>
              Analyze Latest Health Results
            </h2>

            <p>
              The assistant checks the latest completed feature results and creates one combined warning score.
            </p>

            <button
              type="button"
              className="nextgen-primary-button"
              disabled={loading}
              onClick={createHealthReport}
            >
              {loading
                ? 'Analyzing Records...'
                : 'Create Combined Health Report'}
            </button>
          </section>

          {report && (
            <>
              <section
                className={`nextgen-card assistant-result ${reportLevel}`}
              >
                <div className="nextgen-heading-row">
                  <div>
                    <span className="nextgen-kicker">
                      Current Result
                    </span>

                    <h2>
                      Health Decision Summary
                    </h2>
                  </div>

                  <span
                    className={`nextgen-level ${reportLevel}`}
                  >
                    {report.level ||
                      'GOOD'}
                  </span>
                </div>

                <div className="assistant-score-layout">
                  <div className="assistant-score">
                    <strong>
                      {report.overallScore ??
                        0}
                    </strong>

                    <span>
                      Combined Score
                    </span>
                  </div>

                  <div className="assistant-summary-grid">
                    <article>
                      <span>
                        Confidence
                      </span>

                      <strong>
                        {report.confidence ||
                          'LOW'}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Data Sources
                      </span>

                      <strong>
                        {report.sourceCount ??
                          sources.length}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Arduino Command
                      </span>

                      <strong>
                        {report.hardware
                          ?.command ||
                          'NONE'}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Hardware Status
                      </span>

                      <strong>
                        {report.hardware
                          ?.acknowledged
                          ? 'Confirmed'
                          : 'Not confirmed'}
                      </strong>
                    </article>
                  </div>
                </div>

                <p className="assistant-summary">
                  {report.summary ||
                    'No summary was returned.'}
                </p>
              </section>

              <div className="nextgen-two-column">
                <section className="nextgen-card">
                  <span className="nextgen-kicker">
                    Source Results
                  </span>

                  <h2>
                    Feature Intelligence
                  </h2>

                  {sources.length === 0 ? (
                    <div className="nextgen-empty">
                      No completed feature results were found.
                    </div>
                  ) : (
                    <div className="assistant-source-list">
                      {sources.map(
                        source => {
                          const sourceLevel =
                            String(
                              source.level ||
                              'GOOD'
                            ).toLowerCase();

                          return (
                            <article
                              key={
                                source.featureSlug
                              }
                            >
                              <div>
                                <strong>
                                  {source.featureName}
                                </strong>

                                <span
                                  className={`nextgen-level ${sourceLevel}`}
                                >
                                  {source.level}
                                </span>
                              </div>

                              <p>
                                {source.summary ||
                                  'No result summary was provided.'}
                              </p>
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
                </section>

                <section className="nextgen-card">
                  <span className="nextgen-kicker">
                    Recommended Actions
                  </span>

                  <h2>
                    Next Steps
                  </h2>

                  {actions.length === 0 ? (
                    <div className="nextgen-empty">
                      No actions were returned.
                    </div>
                  ) : (
                    <div className="assistant-action-list">
                      {actions.map(
                        (
                          action,
                          index
                        ) => (
                          <div
                            key={`${action}-${index}`}
                          >
                            {action}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>
              </div>
            </>
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
          This prototype supports health monitoring only and does not provide a medical diagnosis.
        </div>
      </section>
    </>
  );
}

export default AIHealthAssistant;

