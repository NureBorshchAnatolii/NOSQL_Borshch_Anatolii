import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

const EMPTY_ANSWER  = () => ({ text: '', isCorrect: false, order: 0 });
const EMPTY_QUESTION = () => ({
  _tmp: Math.random(),
  text: '', questionType: 'single', points: 1, order: 0, explanation: '',
  answers: [EMPTY_ANSWER(), EMPTY_ANSWER()],
});

export default function TestBuilder() {
  const [categories, setCategories] = useState([]);
  const [myTests,    setMyTests]    = useState([]);
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState('');

  const [meta, setMeta] = useState({ categoryId: '', title: '', description: '', passingScore: 70 });
  const [questions, setQuestions] = useState([EMPTY_QUESTION()]);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data));
    api.get('/tests').then(r => setMyTests(r.data));
  }, []);

  const loadTest = async (id) => {
    const { data } = await api.get(`/tests/${id}`);
    setEditId(id);
    setMeta({
      categoryId:   data.categoryId?._id || data.categoryId || '',
      title:        data.title,
      description:  data.description || '',
      passingScore: data.passingScore,
    });
    setQuestions(data.questions.length ? data.questions.map(q => ({
      ...q, _tmp: Math.random(),
      answers: q.answers?.length ? q.answers : [EMPTY_ANSWER(), EMPTY_ANSWER()],
    })) : [EMPTY_QUESTION()]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const id = searchParams.get('edit');
    if (!id || id === editId) return;
    (async () => {
      try {
        await loadTest(id);
      } catch {
        // ignore
      } finally {
        searchParams.delete('edit');
        setSearchParams(searchParams, { replace: true });
      }
    })();
  }, [searchParams]);

  const resetForm = () => {
    setEditId(null);
    setMeta({ categoryId: '', title: '', description: '', passingScore: 70 });
    setQuestions([EMPTY_QUESTION()]);
    setError('');
  };

  const setMetaField = (k) => (e) => setMeta(m => ({ ...m, [k]: e.target.value }));

  const updateQ = (i, field, val) =>
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: val } : q));

  const addQuestion    = () => setQuestions(qs => [...qs, EMPTY_QUESTION()]);
  const removeQuestion = (i) => setQuestions(qs => qs.filter((_, idx) => idx !== i));
  const moveQuestion   = (i, dir) => {
    setQuestions(qs => {
      const arr = [...qs];
      const j   = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  const updateA  = (qi, ai, field, val) =>
    setQuestions(qs => qs.map((q, i) => i !== qi ? q : {
      ...q,
      answers: q.answers.map((a, j) => j !== ai ? a : { ...a, [field]: val }),
    }));

  const addAnswer    = (qi)      => setQuestions(qs => qs.map((q, i) => i !== qi ? q : { ...q, answers: [...q.answers, EMPTY_ANSWER()] }));
  const removeAnswer = (qi, ai)  => setQuestions(qs => qs.map((q, i) => i !== qi ? q : { ...q, answers: q.answers.filter((_, j) => j !== ai) }));

  const setCorrect = (qi, ai) =>
    setQuestions(qs => qs.map((q, i) => i !== qi ? q : {
      ...q,
      answers: q.answers.map((a, j) =>
        q.questionType === 'multiple'
          ? j === ai ? { ...a, isCorrect: !a.isCorrect } : a
          : { ...a, isCorrect: j === ai }
      ),
    }));

  const save = async () => {
    setError(''); setSaving(true);
    try {
      const payload = {
        ...meta,
        passingScore: Number(meta.passingScore),
        questions: questions.map((q, i) => ({
          text:         q.text,
          questionType: q.questionType,
          points:       Number(q.points),
          order:        i,
          explanation:  q.explanation,
          answers:      q.answers.map((a, j) => ({ text: a.text, isCorrect: a.isCorrect, order: j })),
        })),
      };

      if (editId) {
        await api.put(`/tests/${editId}`, payload);
      } else {
        await api.post('/tests', payload);
      }

      const { data } = await api.get('/tests');
      setMyTests(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (!editId) resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const deleteTest = async (id) => {
    if (!confirm('Delete this test?')) return;
    try {
      await api.delete(`/tests/${id}`);
      setMyTests(t => t.filter(x => x._id !== id));
      if (editId === id) resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete');
    }
  };

  return (
    <div className="container page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' }}>
        <div>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>{editId ? 'Edit test' : 'New test'}</h1>
              <p>{editId ? 'Update questions and settings' : 'Create a test for interview prep'}</p>
            </div>
            {editId && <button className="btn btn-ghost btn-sm" onClick={resetForm}>New test</button>}
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}
          {saved  && <div className="alert alert-success" style={{ marginBottom: 20 }}>Test saved successfully</div>}

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 20 }}>Test details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label>Category</label>
                <select className="input" value={meta.categoryId} onChange={setMetaField('categoryId')} required>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Title</label>
                <input className="input" value={meta.title} onChange={setMetaField('title')} required placeholder="e.g. JavaScript Closures" />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea className="input" value={meta.description} onChange={setMetaField('description')} placeholder="What will candidates be tested on?" />
              </div>
              <div className="field" style={{ maxWidth: 160 }}>
                <label>Passing score (%)</label>
                <input className="input" type="number" min={0} max={100} value={meta.passingScore} onChange={setMetaField('passingScore')} />
              </div>
            </div>
          </div>

          {questions.map((q, qi) => (
            <div key={q._tmp || q._id} className="card" style={{ marginBottom: 16, position: 'relative' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span className="badge badge-gray">Q{qi + 1}</span>
                <select
                  className="input" style={{ width: 160, padding: '6px 10px' }}
                  value={q.questionType}
                  onChange={e => updateQ(qi, 'questionType', e.target.value)}
                >
                  <option value="single">Single choice</option>
                  <option value="multiple">Multiple choice</option>
                  <option value="text">Open answer</option>
                </select>
                <input
                  className="input" type="number" min={1} style={{ width: 80, padding: '6px 10px' }}
                  value={q.points} onChange={e => updateQ(qi, 'points', e.target.value)}
                  title="Points"
                />
                <span style={{ fontSize: '.75rem', color: 'var(--ink-3)' }}>pts</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveQuestion(qi, -1)} disabled={qi === 0} title="Move up">↑</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveQuestion(qi, 1)} disabled={qi === questions.length - 1} title="Move down">↓</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeQuestion(qi)} disabled={questions.length === 1} title="Delete" style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label>Question</label>
                <textarea className="input" rows={2} value={q.text} onChange={e => updateQ(qi, 'text', e.target.value)} placeholder="Enter your question…" />
              </div>

              {q.questionType !== 'text' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 8 }}>
                    Answers — click ✓ to mark correct
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.answers.map((ans, ai) => (
                      <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => setCorrect(qi, ai)}
                          style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${ans.isCorrect ? 'var(--success)' : 'var(--line)'}`,
                            background: ans.isCorrect ? 'var(--success)' : 'transparent',
                            color: ans.isCorrect ? 'white' : 'var(--ink-3)',
                            cursor: 'pointer', fontSize: '.75rem', transition: 'all .12s',
                          }}
                          title="Toggle correct"
                        >✓</button>
                        <input
                          className="input" style={{ flex: 1 }}
                          value={ans.text} onChange={e => updateA(qi, ai, 'text', e.target.value)}
                          placeholder={`Answer ${ai + 1}…`}
                        />
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeAnswer(qi, ai)}
                          disabled={q.answers.length <= 2}
                          style={{ color: 'var(--danger)', flexShrink: 0 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => addAnswer(qi)} style={{ marginTop: 10 }}>
                    Add answer
                  </button>
                </div>
              )}

              <div className="field">
                <label>Explanation <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>(shown after answer)</span></label>
                <textarea className="input" rows={2} value={q.explanation} onChange={e => updateQ(qi, 'explanation', e.target.value)} placeholder="Why is this the correct answer?" />
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={addQuestion}>Add question</button>
            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ minWidth: 120 }}>
              {saving ? 'Saving…' : editId ? 'Update test' : 'Save test'}
            </button>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 80 }}>
          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 16, fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-2)' }}>
            Your tests
          </h3>
          {myTests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 32 }}>
              <p style={{ fontSize: '.875rem' }}>No tests yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myTests.map(t => (
                <div key={t._id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 500, fontSize: '.9rem', marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--ink-3)', marginBottom: 10 }}>
                    {t.categoryId?.name} · {t.questions?.length ?? 0} questions
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => loadTest(t._id)} style={{ flex: 1 }}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteTest(t._id)} style={{ color: 'var(--danger)' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}