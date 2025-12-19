import { useEffect, useState } from 'react';

export default function Voting() {
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/candidates', { credentials: 'include' }).then(r => r.json()).then(setCandidates);
  }, []);

  const handleVote = async (id) => {
    const res = await fetch('http://localhost:5000/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ candidateId: id })
    });
    const data = await res.json();
    if (data.message) {
      setHasVoted(true);
      fetch('http://localhost:5000/api/voters', { credentials: 'include' }).then(r => r.json()).then(setVoters);
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="p-10 text-center font-sans">
      <h1 className="text-3xl font-bold mb-8">Support Your Candidate</h1>
      
      {!hasVoted ? (
        <div className="flex justify-center gap-8">
          {candidates.map(c => (
            <div key={c.id} className="border p-6 rounded-xl shadow-lg w-64">
              <h2 className="text-xl font-bold">{c.name}</h2>
              <p className="text-gray-500 mb-4">{c.bio}</p>
              <a href={c.linkedin_url} className="text-blue-600 block mb-4">View Profile</a>
              <button onClick={() => handleVote(c.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Vote</button>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Current Supporters</h2>
          <ul className="max-w-md mx-auto">
            {voters.map((v, i) => (
              <li key={i} className="border-b py-2 flex justify-between">
                <span>{v.display_name}</span>
                <a href={v.linkedin_profile_url} className="text-blue-500 underline">LinkedIn</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}