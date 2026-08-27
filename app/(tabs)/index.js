import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar, Surface, Text, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { getStudents, getInitials } from '../../utils/studentStorage';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DashboardScreen() {
  const router=useRouter(); const { t }=useLanguage(); const [students,setStudents]=useState([]);
  useFocusEffect(useCallback(()=>{ getStudents().then(setStudents); },[]));
  return <View style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <Surface style={styles.card} elevation={1}><View style={styles.header}><Text style={styles.title}>{t('dashMyStudents')}</Text><Button compact onPress={()=>router.push('/(tabs)/student')}>{t('dashAdd')}</Button></View>
    {students.length===0 ? <TouchableOpacity onPress={()=>router.push('/(tabs)/student')}><Text style={styles.empty}>{t('dashNoStudents')}</Text></TouchableOpacity> : students.map(s=><View key={s.id} style={styles.student}><Avatar.Text size={44} label={s.label || getInitials(s.nombre)} backgroundColor={COLORS.PRIMARIO} color={COLORS.BLANCO}/><View style={{marginLeft:12,flex:1}}><Text style={styles.name}>{s.nombre}</Text><Text style={styles.sub}>{s.grado || ''}</Text><Text style={styles.sub}>{s.colegio || ''}</Text></View></View>)}
    </Surface></ScrollView></View>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:COLORS.FONDO_PRINCIPAL},content:{padding:16},card:{backgroundColor:COLORS.FONDO_TARJETA,padding:16,borderRadius:10},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},title:{fontSize:20,fontWeight:'bold',color:COLORS.PRIMARIO},empty:{paddingVertical:24,textAlign:'center',color:COLORS.TEXTO_SECUNDARIO},student:{flexDirection:'row',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:COLORS.GRIS_BORDE},name:{fontWeight:'bold',color:COLORS.TEXTO_GENERAL},sub:{fontSize:12,color:COLORS.TEXTO_SECUNDARIO}});
