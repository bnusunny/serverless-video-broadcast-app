import React from 'react'
import { Text, View, FlatList, TouchableOpacity} from 'react-native';
import { Card, Button, Icon } from "react-native-elements";
import Amplify, { Storage, API, Auth }  from 'aws-amplify';
import awsmobile from '../aws-exports';
Amplify.configure(awsmobile);

// Optionally add Debug Logging
// Amplify.Logger.LOG_LEVEL = 'DEBUG';

export default class HomeScreen extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        loading: false,
        videos: []
      };
    }
  
    static navigationOptions = ({ navigation }) => {
      return {
        title: 'Home',
        headerRight: (
          <Icon
            name='add'
            onPress={() => navigation.navigate('VideoRecord')}
            containerStyle={{padding: 10}}
          />
        ),
        headerLeft: (
          <Icon
            name='menu'
            onPress= {async () => { 
              await Auth.signOut(); 
            }}
            containerStyle={{padding: 10}}
          />
        ),        
      };
    }
    
    async componentDidMount() {
      this.getAllVideos();
    }
    
    async getAllVideos() {
      try {
        this.setState({loading: true});
  
        const apiName = 'apiGetAllVideos';
        const path = '/videos'; 
        const myInit = { 
            headers: {}, 
            response: true, 
        };
        const response = await API.get(apiName, path, myInit);
        const videoItems = response.data.message.Items;
  
        // console.debug("API Response: " + JSON.stringify(videoItems));
  
        this.setState({
          loading: false,
          videos: videoItems
        });
  
      } catch (error) {
        this.setState({loading: false});
        console.log(error);
      }
    }

    handleRefresh() {
      this.getAllVideos();
    }

    render() {
  
      // console.debug(`current state is ${JSON.stringify(this.state)}`);
  
      return (
        <View>
            <FlatList
              data={this.state.videos}
              extraData={this.state}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress = {() => this.props.navigation.navigate('VideoPlay', {playlist: item.playlist, video_urls: item.video_urls})} > 
                  <Card image={{ uri: item.thumbnail }} > 
                      <Text style={{color: 'black'}}> {item.userID} </Text>
                      <Text style={{color: 'blue'}}> {new Date(item.created_at).toLocaleString()} </Text>
                    </Card>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.ID}
              onRefresh={ () => this.handleRefresh() }
              refreshing={this.state.loading}
            />
        </View>
      );
    }
  }
  