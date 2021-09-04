import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import CallButton from './components/CallButton';
import serviceWebRTC from './core/serviceWebRTC';
import serviceWS from './core/serviceWS';
const {width} = Dimensions.get('screen');

const App = () => {
  const [roomID, setRoomID] = useState('');
  const [wsURL, setWSUrl] = useState('');
  const [isFront, setFront] = useState(true);
  const [_localStream, setLocalStream] = useState();
  const [_statusCalling, setStatusCalling] = useState(false);
  const [statusWS, setStatusWS] = useState({
    connecting: false,
    connected: false,
  });
  const [statusRoom, setStatusRoom] = useState({
    connecting: false,
    connected: false,
  });
  const cbWS = (data = {connected: false}) => {
    console.log('data: ', data);
    setStatusWS({
      connected: data.connected,
      connecting: false,
    });
  };
  const cbWebRTC = data => {
    console.log('cbWebRTC: ', data);
    if (data?.connected) {
      setStatusRoom({
        connected: true,
        connecting: false,
      });
    } else if (data?.isLocalStream) {
      let stream = data.localStream;
      if (stream && stream?.toURL()) {
        setLocalStream(stream);
      }
    } else if (data.isStatusChanged) {
      const {statusCalling} = serviceWebRTC;
      setStatusCalling(statusCalling);
    }
  };
  useEffect(() => {
    serviceWS.disconnect();
    serviceWS.addListener(cbWS);
    serviceWebRTC.addListener(cbWebRTC);
    return () => {
      serviceWS.removeListener(cbWS);
      serviceWebRTC.removeListener(cbWebRTC);
    };
  }, []);

  const renderConnectWS = () => {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{'Kết nối server'}</Text>
        <View style={styles.containerInput}>
          <TextInput
            value={wsURL}
            style={styles.input}
            onChangeText={text => setWSUrl(text)}
          />
        </View>
        {statusWS.connecting ? (
          <ActivityIndicator style={styles.loading} size="large" />
        ) : (
          <TouchableOpacity
            onPress={() => {
              setStatusWS({
                connected: false,
                connecting: true,
              });
              serviceWS.connect(wsURL);
            }}
            style={styles.containerBtn}>
            <Text style={styles.textBtn}>{'Kết nối server'}</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  };
  const renderConnectRoom = () => {
    return (
      <View style={styles.content}>
        <Text style={styles.title}>{'Đang kết nối room...'}</Text>
        <ActivityIndicator style={styles.loading} size="large" />
      </View>
    );
  };
  const renderConnected = () => {
    return (
      <SafeAreaView style={styles.content}>
        <View style={styles.contentVideo}>
          <View style={styles.video}>
            <View style={styles.otherVideo}>
              {statusRoom.connected && serviceWebRTC.remoteList[0] ? (
                <RTCView
                  mirror={true}
                  streamURL={serviceWebRTC.remoteList[0]}
                  style={{flex: 1}}
                  objectFit="cover"
                />
              ) : (
                <View style={{flex: 1}} />
              )}
            </View>
            <View style={styles.myVideo}>
              {statusRoom.connected ? (
                <RTCView
                  mirror={true}
                  streamURL={_localStream?.toURL()}
                  style={{flex: 1}}
                  objectFit="cover"
                />
              ) : (
                <View style={{flex: 1}} />
              )}
            </View>
          </View>
          <View style={styles.buttonGroup}>
            <CallButton
              image={require('./images/ic_switch.png')}
              text={isFront ? 'Camera trước' : 'Camera Sau'}
              onPress={() => {
                setFront(prev => !prev);
              }}
            />
            <CallButton
              image={require('./images/ic_call_cancel.png')}
              text={'Ngắt kết nối'}
              onPress={() => {
                setStatusRoom({connected: false, connecting: false});
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  };
  if (!statusWS.connected) {
    return renderConnectWS();
  }
  if (statusRoom.connected) {
    return renderConnected();
  }
  return (
    <SafeAreaView style={{flex: 1, justifyContent: 'space-between'}}>
      {statusRoom.connecting ? (
        renderConnectRoom()
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>{'Nhập room'}</Text>
          <View style={styles.containerInput}>
            <TextInput
              value={roomID}
              style={styles.input}
              onChangeText={text => setRoomID(text)}
            />
          </View>
        </View>
      )}
      {!statusRoom.connecting && (
        <TouchableOpacity
          onPress={() => {
            setStatusRoom({
              connected: false,
              connecting: true,
            });
            serviceWebRTC.join(roomID);
            serviceWebRTC.startLocalStream(isFront);
          }}
          style={styles.btnJoin}>
          <Text style={styles.textBtn}>{'Tham gia'}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => {
          setStatusWS({
            connected: false,
            connecting: false,
          });
          setStatusRoom({
            connected: false,
            connecting: false,
          });
          serviceWS.disconnect();
        }}
        style={[
          styles.containerBtn,
          {marginTop: 10, backgroundColor: '#F5F5F5'},
        ]}>
        <Text style={styles.textBtn}>{'Ngắt kết nối server'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  containerInput: {
    width: '80%',
    padding: 20,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginTop: 50,
  },
  content: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {textAlign: 'center', fontSize: 24, fontWeight: '500', marginTop: 100},
  input: {padding: 0, color: 'black', fontSize: 16},
  containerBtn: {
    backgroundColor: 'green',
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 100,
    alignSelf: 'center',
    marginTop: 100,
  },
  btnJoin: {
    backgroundColor: 'green',
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 100,
    alignSelf: 'center',
  },
  loading: {
    marginTop: 100,
    alignSelf: 'center',
  },
  textBtn: {textAlign: 'center', fontSize: 20, fontWeight: '500'},
  video: {
    flex: 1,
    alignItems: 'center',
  },
  otherVideo: {
    flex: 1,
    width: width - 32,
    backgroundColor: '#172B4D',
    borderRadius: 16,
    overflow: 'hidden',
  },
  myVideo: {
    position: 'absolute',
    width: '30%',
    height: '30%',
    right: 12,
    bottom: 12,
    borderRadius: 8,
    backgroundColor: '#5E6C84',
    overflow: 'hidden',
  },
  contentVideo: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  buttonGroup: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
export default App;
