import React from 'react';
import {TouchableOpacity, Text, Image, StyleSheet} from 'react-native';

const CallButton = props => {
  const {image, text, onPress} = props;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={styles.callButton}>
      <Image
        source={image}
        style={styles.callButtonImage}
        resizeMode="contain"
      />
      <Text style={styles.callButtonText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  callButton: {
    alignItems: 'center',
    flex: 1,
  },
  callButtonImage: {width: 50, height: 50},
  callButtonText: {
    marginTop: 8,
    color: '#172B4D',
    fontSize: 14,
    fontWeight: 'normal',
  },
});

export default CallButton;
