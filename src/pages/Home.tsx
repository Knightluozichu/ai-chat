import { HeroSection } from '../components/home/HeroSection';
import { FeaturedPosts } from '../components/home/FeaturedPosts';

const Home = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturedPosts />
    </div>
  );
};

export default Home; 