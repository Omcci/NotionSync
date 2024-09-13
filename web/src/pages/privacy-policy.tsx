const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p>
        <strong>Effective Date:</strong> 12/09/2024
      </p>

      <h2 className="text-2xl font-semibold mt-6">1. Introduction</h2>
      <p>
        We value your privacy and are committed to protecting your personal
        data. This Privacy Policy outlines how we collect, use, and safeguard
        your information when you interact with our services, including
        integrations with third-party platforms like GitHub and Notion.
      </p>

      <h2 className="text-2xl font-semibold mt-6">2. Information We Collect</h2>
      <ul className="list-disc list-inside">
        <li>
          <strong>Personal Information:</strong> Name, email address, GitHub
          username, Notion account information, and any other data you provide.
        </li>
        <li>
          <strong>OAuth Data:</strong> Data from GitHub and Notion OAuth
          connections.
        </li>
        <li>
          <strong>Usage Data:</strong> Information about how you use our
          services, including IP address and browser type.
        </li>
        <li>
          <strong>Third-Party Data:</strong> Data from third-party platforms
          like GitHub and Notion when you connect those accounts to our
          services.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6">
        3. How We Use Your Information
      </h2>
      <ul className="list-disc list-inside">
        <li>
          <strong>Service Integration:</strong> Access repositories, databases,
          or content from GitHub and Notion for synchronization services.
        </li>
        <li>Providing and improving our services.</li>
        <li>User account management and authentication.</li>
        <li>Processing user requests and fulfilling obligations.</li>
        <li>Sending notifications and updates.</li>
        <li>Analyzing usage patterns to enhance the user experience.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6">4. How We Share Your Data</h2>
      <p>
        We may share your information with third-party providers, GitHub,
        Notion, legal authorities, and in the case of a business transfer.
      </p>

      <h2 className="text-2xl font-semibold mt-6">5. Data Retention</h2>
      <p>
        We retain your personal data as long as necessary for providing our
        services or as required by law.
      </p>

      <h2 className="text-2xl font-semibold mt-6">6. Your Rights</h2>
      <p>
        You have the right to access, update, or delete your information and
        withdraw consent to OAuth connections at any time.
      </p>

      <h2 className="text-2xl font-semibold mt-6">7. Security Measures</h2>
      <p>
        We implement SSL encryption and other security measures to protect your
        data from unauthorized access or disclosure.
      </p>

      <h2 className="text-2xl font-semibold mt-6">8. Cookies</h2>
      <p>
        We use cookies to improve user experience and analyze site traffic. You
        can opt out through your browser settings.
      </p>

      <h2 className="text-2xl font-semibold mt-6">9. Third-Party Links</h2>
      <p>
        Our service may contain links to third-party websites, and we are not
        responsible for their privacy practices.
      </p>

      <h2 className="text-2xl font-semibold mt-6">
        10. Changes to This Policy
      </h2>
      <p>
        We may update this Privacy Policy, and significant changes will be
        notified through this page.
      </p>

      <h2 className="text-2xl font-semibold mt-6">11. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, contact us at
        notionsync.dev@gmail.com.
      </p>
    </div>
  )
}

export default PrivacyPolicy
