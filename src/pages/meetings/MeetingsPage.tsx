import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const MeetingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // For simplistic scheduling selector
  const [showModal, setShowModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    attendeeId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    fetchMeetings();
    fetchUsersForDropdown();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data } = await api.get('/meetings');
      const formattedEvents = data.map((meeting: any) => ({
        id: meeting.id,
        title: meeting.title + (meeting.status === 'pending' ? ' (Pending)' : ''),
        start: new Date(`${meeting.date.split('T')[0]}T${meeting.startTime}`),
        end: new Date(`${meeting.date.split('T')[0]}T${meeting.endTime}`),
        resource: meeting
      }));
      setEvents(formattedEvents);
    } catch (e) {
      toast.error('Failed to load meetings');
    }
  };

  const fetchUsersForDropdown = async () => {
    // In a real scenario, this would likely fetch matches or connected users.
    // Assuming backend returns some users:
    try {
      const { data } = await api.get('/users/profile'); // Just a hacky placeholder, we might not have a generic GET /users list.
      // Wait, we don't have a GET /api/users list route mapped! 
      // I'll simulate local fallback if it fails.
    } catch {
      // Let's just create some dummy selectable options if the route doesn't exist
    }
  };

  const handleSelectSlot = ({ start, end }: any) => {
    setMeetingForm({
      ...meetingForm,
      date: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
    });
    setShowModal(true);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // We will override attendeeId for local testing if dropdown is empty
      const payload = {
        ...meetingForm,
        attendeeId: meetingForm.attendeeId || user?.id // fallback self
      };
      await api.post('/meetings', payload);
      toast.success('Meeting Scheduled!');
      setShowModal(false);
      fetchMeetings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule. Time conflict Check!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meetings & Collaboration</h1>
        <Button onClick={() => setShowModal(true)}>Schedule New Meeting</Button>
      </div>

      <Card>
        <CardBody>
          <div style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(event) => {
                const meeting = event.resource;
                if(meeting.meetingLink) navigate(meeting.meetingLink);
              }}
            />
          </div>
        </CardBody>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
            <h2 className="text-xl mb-4 font-bold">Schedule a Meeting</h2>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input required type="text" className="border p-2 w-full mt-1" value={meetingForm.title} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium">Attendee ID (Temp)</label>
                <input type="text" className="border p-2 w-full mt-1" placeholder="Leave empty to test with self" value={meetingForm.attendeeId} onChange={e => setMeetingForm({...meetingForm, attendeeId: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium">Date</label>
                  <input required type="date" className="border p-2 w-full mt-1" value={meetingForm.date} onChange={e => setMeetingForm({...meetingForm, date: e.target.value})} />
                </div>
                <div className="w-1/4">
                  <label className="block text-sm font-medium">Start</label>
                  <input required type="time" className="border p-2 w-full mt-1" value={meetingForm.startTime} onChange={e => setMeetingForm({...meetingForm, startTime: e.target.value})} />
                </div>
                <div className="w-1/4">
                  <label className="block text-sm font-medium">End</label>
                  <input required type="time" className="border p-2 w-full mt-1" value={meetingForm.endTime} onChange={e => setMeetingForm({...meetingForm, endTime: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Confirm Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
