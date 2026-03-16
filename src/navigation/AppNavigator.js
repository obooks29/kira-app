import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { Colors, Typography } from '../theme';
import { useApp } from '../utils/AppContext';

// Onboarding
import WelcomeScreen    from '../screens/onboarding/WelcomeScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Main tabs
import HomeScreen    from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

// Screens
import MyVoiceScreen      from '../screens/phase1/MyVoiceScreen';
import QuickPhrases       from '../screens/phase1/QuickPhrasesScreen';
import MyEarsScreen       from '../screens/phase2/MyEarsScreen';
import ConversationScreen from '../screens/phase2/ConversationScreen';
import MyWorldScreen      from '../screens/phase2/MyWorldScreen';
import MySafetyScreen     from '../screens/phase3/MySafetyScreen';
import CaregiverScreen    from '../screens/phase3/CaregiverScreen';
import MilestonesScreen   from '../screens/phase3/MilestonesScreen';
import PersonalizeScreen  from '../screens/phase4/PersonalizeScreen';
import LanguagePackScreen from '../screens/phase4/LanguagePackScreen';
import SettingsScreen     from '../screens/shared/SettingsScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:     '🏠',
  MyVoice:  '🤲',
  MyEars:   '👂',
  MySafety: '🛡️',
  Profile:  '👤',
};

function TabIcon({ name, focused }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: focused ? 22 : 19 }}>{TAB_ICONS[name]}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.disabled,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          paddingTop: 6,
          paddingBottom: 8,
          height: 68,
        },
        tabBarLabelStyle: { ...Typography.labelSmall, marginTop: 2 },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="MyVoice"  component={MyVoiceScreen}  options={{ tabBarLabel: 'My Voice' }} />
      <Tab.Screen name="MyEars"   component={MyEarsScreen}   options={{ tabBarLabel: 'My Ears' }} />
      <Tab.Screen name="MySafety" component={MySafetyScreen} options={{ tabBarLabel: 'Safety' }} />
      <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { state } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [{
                translateX: current.progress.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              }],
            },
          }),
        }}
      >
        {!state.isOnboarded ? (
          <>
            <Stack.Screen name="Welcome"    component={WelcomeScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs"    component={MainTabs} />
            <Stack.Screen name="QuickPhrases"  component={QuickPhrases}
              options={{ presentation: 'modal', cardStyleInterpolator: ({ current }) => ({
                cardStyle: { opacity: current.progress },
              })}} />
            <Stack.Screen name="Conversation"  component={ConversationScreen} />
            <Stack.Screen name="MyWorld"       component={MyWorldScreen} />
            <Stack.Screen name="Caregiver"     component={CaregiverScreen} />
            <Stack.Screen name="Milestones"    component={MilestonesScreen} />
            <Stack.Screen name="Personalize"   component={PersonalizeScreen} />
            <Stack.Screen name="LanguagePacks" component={LanguagePackScreen} />
            <Stack.Screen name="Settings"      component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}