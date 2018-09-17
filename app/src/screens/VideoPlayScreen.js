import React from 'react'
import { Dimensions, View, StyleSheet} from 'react-native';
import { Video, ScreenOrientation } from 'expo';
import VideoPlayer from '@expo/videoplayer';


export default class VideoPlayScreenScreen extends React.Component {
    static navigationOptions = ({ navigation }) => ({
        header: null,
        tabBarVisible:
          navigation.state.params && navigation.state.params.tabBarHidden
            ? false
            : true,
    });

    state = {
        isPortrait: true,
    };

    componentWillUnmount() {
        ScreenOrientation.allow(ScreenOrientation.Orientation.PORTRAIT);
        Dimensions.removeEventListener('change', this.orientationChangeHandler);
    }

    componentDidMount() {
        this.video._playbackInstance.presentFullscreenPlayer();
    }
    
    orientationChangeHandler(dims) {
        const { width, height } = dims.window;
        const isLandscape = width > height;
        this.setState({ isPortrait: !isLandscape });
        this.props.navigation.setParams({ tabBarHidden: isLandscape });
        ScreenOrientation.allow(ScreenOrientation.Orientation.ALL);
    }

    switchToLandscape() {
        ScreenOrientation.allow(ScreenOrientation.Orientation.LANDSCAPE);
    }

    switchToPortrait() {
        ScreenOrientation.allow(ScreenOrientation.Orientation.PORTRAIT);
    }

    render() {

        const playlist = this.props.navigation.getParam('playlist', null)
        const video_urls = this.props.navigation.getParam('video_urls', null);
        const first_video = video_urls[0];
        console.debug(`navigation paramter 'first_video': ${first_video}`);

        return (
            <View style={styles.container}>
                <VideoPlayer
                    videoProps={{
                        shouldPlay: true,
                        resizeMode: Video.RESIZE_MODE_CONTAIN,
                        source: {
                            // uri: playlist,
                            uri: first_video,
                        },
                    }}
                    ref={ref => {
                        this.video = ref;
                    }}
                    isPortrait={this.state.isPortrait}
                    playFromPositionMillis={0}
                    switchToLandscape={this.switchToLandscape.bind(this)}
                    switchToPortrait={this.switchToPortrait.bind(this)}
                    />
            </View>
            
        )
    }

}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
});