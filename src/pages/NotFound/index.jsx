import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-lg text-gray-500">页面不存在</p>
        <Link
          to="/"
          className="mt-6 inline-block text-blue-600 hover:text-blue-800 underline"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
