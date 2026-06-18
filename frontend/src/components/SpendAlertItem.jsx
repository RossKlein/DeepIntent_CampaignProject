import { Link } from 'react-router-dom'
import { formatDateTime } from '../utils/format'

function GitHubLinkButton({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open GitHub issue"
      title="Open in GitHub"
      className="mt-0.5 shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm13-2a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0V6.31l-5.22 5.22a.75.75 0 11-1.06-1.06l5.22-5.22H11a.75.75 0 010-1.5h3.25A.75.75 0 0117.25 3.5z"
          clipRule="evenodd"
        />
      </svg>
    </a>
  )
}

export function SpendAlertItem({
  issue,
  linkToCampaign,
  titleClassName = 'text-sm font-medium text-blue-700 hover:underline',
}) {
  const title = issue.title.trim() || 'Spend alert'

  return (
    <>
      <div className="flex items-start gap-2">
        {linkToCampaign ? (
          <Link
            to={`/campaigns/${issue.campaign_id}`}
            className={`min-w-0 flex-1 ${titleClassName}`}
          >
            {title}
          </Link>
        ) : (
          <a
            href={issue.github_issue_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`min-w-0 flex-1 ${titleClassName}`}
          >
            {title}
          </a>
        )}
        <GitHubLinkButton url={issue.github_issue_url} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {formatDateTime(issue.created_at)}
      </p>
    </>
  )
}

export function SpendAlertCard({ issue }) {
  const title = issue.title.trim() || 'Spend alert'

  return (
    <>
      <div className="flex items-start gap-2">
        <a
          href={issue.github_issue_url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 text-lg font-semibold text-blue-700 hover:underline"
        >
          {title}
        </a>
        <GitHubLinkButton url={issue.github_issue_url} />
      </div>
      <p className="mt-2 text-sm text-slate-500">
        <Link
          to={`/campaigns/${issue.campaign_id}`}
          className="text-blue-600 hover:underline"
        >
          {issue.campaign_name}
        </Link>
        {' · '}
        {formatDateTime(issue.created_at)}
      </p>
    </>
  )
}
