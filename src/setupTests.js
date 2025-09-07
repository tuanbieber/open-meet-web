import {
  configure,
  mount,
  ReactWrapper,
  shallow,
  ShallowWrapper,
} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

export { shallow, mount, ReactWrapper, ShallowWrapper };
