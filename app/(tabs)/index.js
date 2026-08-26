import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS } from '../../constants/colors';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.card} elevation={1}>
          <Avatar.Text size={56} label={(user?.name || 'GE').substring(0,2).toUpperCase()} backgroundColor={COLORS.PRIMARIO} color={COLORS.BLANCO} />
          <View style={styles.textBlock}>
            <Text style={styles.title}>{t('navDashboard')}</Text>
            <Text style={styles.subtitle}>{user?.name || user?.email || 'Guardian Escolar'}</Text>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}
const styles=StyleSheet.create({ container:{flex:1,backgroundColor:COLORS.FONDO_PRINCIPAL}, content:{padding:20}, card:{backgroundColor:COLORS.FONDO_TARJETA,borderRadius:12,padding:20,flexDirection:'row',alignItems:'center'}, textBlock:{marginLeft:16,flex:1}, title:{fontSize:24,fontWeight:'bold',color:COLORS.PRIMARIO}, subtitle:{marginTop:4,color:COLORS.TEXTO_SECUNDARIO} });
