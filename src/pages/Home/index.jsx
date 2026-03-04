import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">Welcome</h1>
        <p className="mt-3 text-lg text-gray-500">项目已就绪，开始构建你的应用吧</p>
        <Link
          to="/test-404"
          className="mt-6 inline-block text-sm text-gray-400 hover:text-gray-600 underline"
        >
          测试 404 页面
        </Link>
      </div>
    </div>
  );
}

export default Home;
