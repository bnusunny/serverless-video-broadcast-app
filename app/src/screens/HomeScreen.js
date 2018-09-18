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
        videos: [],
        votes: {},
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
  
        const videoVotes = videoItems.reduce( function (accumulator, currentItem) {
          accumulator[currentItem.ID] = currentItem.voteCount || 0;
          return accumulator;
        } , {} );
  
        this.setState({
          loading: false,
          videos: videoItems,
          votes: videoVotes,
        });
  
      } catch (error) {
        this.setState({loading: false});
        console.log(error);
      }
    }

    handleRefresh() {
      this.getAllVideos();
    }

    async increaseVote(itemID) {
      const originalLocalVotes = Object.assign({}, this.state.votes);
      try {
        const currentLocalVotes = Object.assign({}, this.state.votes);
        currentLocalVotes[itemID] = currentLocalVotes[itemID] ? currentLocalVotes[itemID] + 1 : 1;
        this.setState({votes: currentLocalVotes}); 
  
        const response = await API.post('apiUpVote', '/vote', {
            response: true,
            body: {
              ID: `${itemID}`,
            }
        });
        const serverVote = response.data.message.voteCount;
        const currentVotes = Object.assign({}, this.state.votes);
        currentVotes[itemID] = serverVote; 
        this.setState({votes: currentVotes}); 
  
      } catch (error) {
        this.setState({votes: originalLocalVotes}); 
        console.error(error);
      }

    }

    render() {
  
      // console.debug(`current votes is ${JSON.stringify(this.state.votes)}`);
  
      return (
        <View>
            <FlatList
              data={this.state.videos}
              extraData={this.state}
              renderItem={({ item }) => (
                <Card 
                  image={{ uri: item.thumbnail }}
                  onPressImage = {() => this.props.navigation.navigate('VideoPlay', {playlist: item.playlist})}  
                  > 
                  <View style={{flex: 1, flexDirection: 'row'}}>
                    <View style={{flex: 3 }}>
                      <Text style={{color: 'black'}}> {item.userID} </Text>
                      <Text style={{color: 'blue'}}> {new Date(item.created_at).toLocaleString()} </Text>
                    </View>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                      <TouchableOpacity onPress={() => this.increaseVote(item.ID)} >
                        <Icon name='favorite' color='red' ></Icon>
                      </TouchableOpacity>
                      <Text > {this.state.votes[item.ID] || 0} </Text>
                    </View>
                  </View>
                </Card>
              )}
              keyExtractor={item => item.ID}
              onRefresh={ () => this.handleRefresh() }
              refreshing={this.state.loading}
            />
        </View>
      );
    }
  }
  