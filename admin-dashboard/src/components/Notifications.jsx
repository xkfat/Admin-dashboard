export default function Notification() {
    return(
        <div className="bg-white rounded-lg shadow-sm border">
  <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 rounded-t-lg">
    <h2 className="text-lg font-semibold">Admin Notifications</h2>
  </div>
  <div id="notificationsList">
    {/* Notification 1 - Unread */}
    <div
      className="notification-item unread"
      data-type="cases"
      data-read="false"
    >
      <div className="flex items-start">
        <div className="notification-icon-circle notification-new">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                New missing person case submitted: John Doe
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                A new case has been submitted and requires review. AI facial
                recognition scan has been initiated automatically.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                2023-05-29 • Case ID: #001
              </p>
            </div>
            <button
              className="text-blue-600 text-sm font-medium hover:text-blue-800"
              onclick="viewCase(1)"
            >
              View Case
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* Notification 2 - Unread */}
    <div
      className="notification-item unread"
      data-type="reports"
      data-read="false"
    >
      <div className="flex items-start">
        <div className="notification-icon-circle notification-report">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                New report submitted for Jane Smith case
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Anonymous witness reported a sighting near downtown area.
                Requires verification.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                2023-05-28 • Report ID: #R-003
              </p>
            </div>
            <button
              className="text-green-600 text-sm font-medium hover:text-green-800"
              onclick="viewReport(3)"
            >
              View Report
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* Notification 3 - Unread */}
    <div
      className="notification-item unread"
      data-type="matches"
      data-read="false"
    >
      <div className="flex items-start">
        <div className="notification-icon-circle notification-match">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-5 5v-5zM4.343 15.657l9.9-9.9a2.121 2.121 0 013 3l-9.9 9.9a2.121 2.121 0 01-3-3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                AI found potential match (95% confidence)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                High confidence match found for Mike Johnson case. Requires
                admin review and confirmation.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                2023-05-28 • Match ID: #M-005
              </p>
            </div>
            <button
              className="text-purple-600 text-sm font-medium hover:text-purple-800"
              onclick="showPage('ai-matches')"
            >
              Review Match
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* Notification 4 - Read */}
    <div className="notification-item" data-type="cases" data-read="true">
      <div className="flex items-start">
        <div className="notification-icon-circle notification-system">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                Case status updated: Sarah Wilson → Found
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Case has been successfully resolved. Match was confirmed by
                admin review.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                2023-05-27 • Case ID: #004
              </p>
            </div>
            <span className="text-green-600 text-sm font-medium">Resolved</span>
          </div>
        </div>
      </div>
    </div>
    {/* Notification 5 - Read */}
    <div className="notification-item" data-type="system" data-read="true">
      <div className="flex items-start">
        <div className="notification-icon-circle notification-system">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                System backup completed successfully
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Daily system backup has been completed. All data is secure and
                up to date.
              </p>
              <p className="text-xs text-gray-400 mt-2">2023-05-27 • System</p>
            </div>
            <span className="text-gray-500 text-sm">System</span>
          </div>
        </div>
      </div>
    </div>
    {/* More notifications can be added here */}
  </div>
  <div className="p-4 text-center border-t">
    <button
      className="text-blue-600 hover:text-blue-800 font-medium"
      onclick="loadMoreNotifications()"
    >
      Load More Notifications
    </button>
  </div>
</div>

    )
}