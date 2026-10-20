import './Reports.css';
import { Link } from 'react-router-dom';

const monthlyActivity = [
  { month: 'Jan', completed: 34, planned: 42 },
  { month: 'Feb', completed: 46, planned: 50 },
  { month: 'Mar', completed: 39, planned: 48 },
  { month: 'Apr', completed: 58, planned: 62 },
  { month: 'May', completed: 66, planned: 70 },
  { month: 'Jun', completed: 74, planned: 78 }
];

const summary = [
  { label: 'Asset uptime', value: '96.8%', detail: '+3.4% this month', tone: 'teal' },
  { label: 'Completed work', value: '74', detail: 'of 78 planned tasks', tone: 'blue' },
  { label: 'Overdue items', value: '06', detail: 'Needs attention', tone: 'orange' },
  { label: 'Maintenance cost', value: '$12.4k', detail: '8% below forecast', tone: 'green' }
];

function Reports() {
  const maxValue = 80;

  return (
    <section className="reports-page app-page">
      <header className="app-page-header reports-header">
        <div>
          <p className="app-page-eyebrow">MAINTENANCE INTELLIGENCE</p>
          <h2>Reports &amp; insights</h2>
          <p>See how your assets, work orders, and maintenance plans are performing.</p>
        </div>
        <button className="reports-export" type="button" onClick={() => window.print()}>Export report</button>
      </header>

      <div className="reports-summary-grid">
        {summary.map(item => (
          <article className={`report-stat report-stat-${item.tone}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </div>

      <div className="reports-content-grid">
        <article className="reports-panel reports-activity-panel">
          <div className="reports-panel-heading">
            <div>
              <p className="reports-kicker">WORK ORDER FLOW</p>
              <h3>Planned vs completed</h3>
            </div>
            <span className="reports-period">Last 6 months</span>
          </div>
          <div className="reports-chart" aria-label="Planned and completed work orders chart">
            {monthlyActivity.map(item => (
              <div className="reports-chart-column" key={item.month}>
                <div className="reports-bars">
                  <span className="reports-bar reports-bar-planned" style={{ height: `${item.planned / maxValue * 100}%` }} title={`${item.planned} planned`} />
                  <span className="reports-bar reports-bar-completed" style={{ height: `${item.completed / maxValue * 100}%` }} title={`${item.completed} completed`} />
                </div>
                <small>{item.month}</small>
              </div>
            ))}
          </div>
          <div className="reports-legend">
            <span><i className="reports-legend-dot planned" /> Planned</span>
            <span><i className="reports-legend-dot completed" /> Completed</span>
          </div>
        </article>

        <article className="reports-panel reports-focus-panel">
          <p className="reports-kicker">NEXT BEST ACTION</p>
          <h3>Reduce overdue work before the next review.</h3>
          <p>Six work orders are beyond their planned date. Assign owners and schedule a review to protect this month&apos;s uptime target.</p>
          <Link className="reports-action" to="/maintenance">Review overdue work <span aria-hidden="true">→</span></Link>
        </article>
      </div>
    </section>
  );
}

export default Reports;
