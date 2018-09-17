import {
  createStackNavigator
} from 'react-navigation';
import {
  withAuthenticator
} from 'aws-amplify-react-native';

import HomeScreen from './src/screens/HomeScreen';
import VideoPlayScreen from './src/screens/VideoPlayScreen';
import VideoRecordScreen from './src/screens/VideoRecordScreen';

const AppNavigator = createStackNavigator({
  Home: HomeScreen,
  VideoPlay: VideoPlayScreen,
  VideoRecord: VideoRecordScreen,
  },
  {
    initialRouteName: 'Home',
  }
)


export default withAuthenticator(AppNavigator);