import { Container } from '../components/layout/Container';
import { Profile } from '../components/about/Profile';

const About = () => {
  return (
    <Container>
      <div className="py-8">
        <Profile />
      </div>
    </Container>
  );
};

export default About; 