import React from 'react'
import { Text, View, StyleSheet, TouchableOpacity} from 'react-native';
import { Camera, Permissions } from 'expo';
import { Icon } from 'react-native-elements'
import Amplify, { Storage }  from 'aws-amplify';
import awsmobile from '../aws-exports';
import uuid from 'react-native-uuid';

Amplify.configure(awsmobile);

// set the default access level to protected: 
//     readable by all users, writable by the owner
Storage.configure({ level: 'protected' });
// enable event tracking for storage
Storage.configure({ track: true });


export default class VideoRecordScreen extends React.Component {
    static navigationOptions = ({ navigation }) => ({
        header: null,
    });

    state = {
        hasCameraPermission: null,
        type: Camera.Constants.Type.back,
        isRecording: false,
    };

    async componentWillMount() {
        const { status } = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({ hasCameraPermission: status === 'granted' });
    }

    startVideoRecording = async () => {

        this.setState({
          isRecording: true,
        })
        const videoRecordURI = await this.camera.recordAsync({maxDuration: 15});
        console.debug(` video recording URI: ${JSON.stringify(videoRecordURI)}`);

        this.setState({
          isRecording: false,
        })

        const response = await fetch(videoRecordURI.uri);
        const blob = await response.blob();

        const uri_split =videoRecordURI.uri.split('/');
        const targetKey = uuid.v1() + '/' + uri_split[uri_split.length - 1];

        Storage.put(targetKey, blob, {
          level: 'protected',
          contentType: 'video/quicktime',
        })
        .then (result => console.log('video is saved to s3. ' + JSON.stringify(result)))
        .catch(err => console.log('failed to upload video to s3. error: ' + JSON.stringify(err)));

    }
    
    render() {
        const { hasCameraPermission } = this.state;
        if (hasCameraPermission === null) {
          return <View />;
        } else if (hasCameraPermission === false) {
          return <Text>No access to camera</Text>;
        } else {
          return (
            <View style={{ flex: 1 }}>
              <Camera style={{ flex: 1 }} 
                type={this.state.type}
                ref={ref => {
                    this.camera = ref;
                  }}
                >
                <View
                  style={{
                    backgroundColor: 'transparent',
                    flex: 1, 
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems:'flex-end'
                  }}>
                      {
                        this.state.isRecording   
                        ? (<TouchableOpacity onPress={() => this.camera.stopRecording()} > 
                            <Icon name="stop" size={70} color="red" />
                          </TouchableOpacity>)
                        : (<TouchableOpacity onPress={this.startVideoRecording} > 
                            <Icon name="radio-button-checked" size={70} color="white" />
                          </TouchableOpacity>)
                      }
                </View>
              </Camera>
            </View>
          );
        }
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