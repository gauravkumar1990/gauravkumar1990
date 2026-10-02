import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';

const STORAGE_KEY = '@todo_reminder_tasks_v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [reminderAt, setReminderAt] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) await Notifications.requestPermissionsAsync();
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw));
    })();
  }, []);

  const saveTasks = async (next) => {
    setTasks(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addTask = async () => {
    const trimmed = title.trim();
    if (!trimmed) return Alert.alert('Task required', 'Enter a task first.');
    if (reminderAt.getTime() <= Date.now()) return Alert.alert('Choose a future time', 'Reminder time must be in the future.');

    let notificationId = null;
    try {
      notificationId = await Notifications.scheduleNotificationAsync({
        content: { title: 'Todo Reminder', body: trimmed, sound: 'default' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderAt, channelId: 'reminders' },
      });
    } catch (e) {
      Alert.alert('Reminder warning', 'Task will be saved, but notification scheduling failed.');
    }

    const task = {
      id: String(Date.now()),
      title: trimmed,
      reminderAt: reminderAt.toISOString(),
      done: false,
      notificationId,
    };
    await saveTasks([task, ...tasks]);
    setTitle('');
    setReminderAt(new Date(Date.now() + 60 * 60 * 1000));
  };

  const toggleTask = async (task) => {
    const next = tasks.map((t) => t.id === task.id ? { ...t, done: !t.done } : t);
    await saveTasks(next);
  };

  const deleteTask = async (task) => {
    if (task.notificationId) {
      try { await Notifications.cancelScheduledNotificationAsync(task.notificationId); } catch {}
    }
    await saveTasks(tasks.filter((t) => t.id !== task.id));
  };

  const filtered = useMemo(() => tasks.filter((t) => filter === 'all' || (filter === 'active' ? !t.done : t.done)), [tasks, filter]);

  const format = (iso) => new Date(iso).toLocaleString();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.heading}>Todo Reminder</Text>
        <Text style={styles.subheading}>Tasks and reminders, stored on your phone</Text>

        <View style={styles.card}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            style={styles.input}
            returnKeyType="done"
          />

          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={() => setShowDate(true)}>
              <Text style={styles.secondaryText}>📅 {reminderAt.toLocaleDateString()}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => setShowTime(true)}>
              <Text style={styles.secondaryText}>⏰ {reminderAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </Pressable>
          </View>

          {showDate && (
            <DateTimePicker
              value={reminderAt}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDate(false);
                if (date) {
                  const next = new Date(reminderAt);
                  next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setReminderAt(next);
                }
              }}
            />
          )}

          {showTime && (
            <DateTimePicker
              value={reminderAt}
              mode="time"
              onChange={(_, date) => {
                setShowTime(false);
                if (date) {
                  const next = new Date(reminderAt);
                  next.setHours(date.getHours(), date.getMinutes(), 0, 0);
                  setReminderAt(next);
                }
              }}
            />
          )}

          <Pressable style={styles.primaryButton} onPress={addTask}>
            <Text style={styles.primaryText}>+ Add task & reminder</Text>
          </Pressable>
        </View>

        <View style={styles.filters}>
          {['all', 'active', 'done'].map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filtered.length ? styles.list : styles.emptyList}
          ListEmptyComponent={<Text style={styles.empty}>No tasks here yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <Pressable onPress={() => toggleTask(item)} style={[styles.check, item.done && styles.checkDone]}>
                <Text>{item.done ? '✓' : ''}</Text>
              </Pressable>
              <View style={styles.taskBody}>
                <Text style={[styles.taskTitle, item.done && styles.doneText]}>{item.title}</Text>
                <Text style={styles.when}>{format(item.reminderAt)}</Text>
              </View>
              <Pressable onPress={() => deleteTask(item)} hitSlop={10}>
                <Text style={styles.delete}>Delete</Text>
              </Pressable>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7fb' },
  container: { flex: 1, padding: 18 },
  heading: { fontSize: 30, fontWeight: '800', marginTop: 6 },
  subheading: { color: '#677084', marginBottom: 18 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 18, gap: 12, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#e1e4ec', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#f0f2f8' },
  secondaryText: { textAlign: 'center', fontWeight: '600' },
  primaryButton: { backgroundColor: '#111827', padding: 14, borderRadius: 12 },
  primaryText: { color: 'white', textAlign: 'center', fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#e8ebf2' },
  filterActive: { backgroundColor: '#111827' },
  filterText: { fontWeight: '700', color: '#505a6c' },
  filterTextActive: { color: 'white' },
  list: { gap: 10, paddingBottom: 28 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#7c8494' },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 14, borderRadius: 14, gap: 12 },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: '#9ca3af', alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
  taskBody: { flex: 1 },
  taskTitle: { fontWeight: '700', fontSize: 16 },
  doneText: { textDecorationLine: 'line-through', color: '#9ca3af' },
  when: { marginTop: 4, color: '#7c8494', fontSize: 12 },
  delete: { color: '#dc2626', fontWeight: '700' },
});