import Layout from "../components/Layout";

const Dashboard = () => {
  return (
    <Layout>
      <h1 className="text-3xl font-semibold text-center">Dashboard</h1>
      <div className="m-4">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Start Sync
        </button>
        <div id="syncStatus"></div>
      </div>
    </Layout>
  );
};

export default Dashboard;
