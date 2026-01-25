interface ComingSoonProps {
  moduleName: string;
}

export default function ComingSoon({ moduleName }: ComingSoonProps) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--gold)' }}>
        {moduleName}
      </h2>
      <p style={{ fontSize: '1.125rem', color: 'rgba(247, 247, 245, 0.85)', maxWidth: '600px', margin: '0 auto' }}>
        This powerful financial planning module is currently in development. 
        It will be available to Founding 200 members soon.
      </p>
      <p style={{ fontSize: '0.95rem', color: 'var(--gold)', marginTop: '1.5rem' }}>
        Stay tuned for updates!
      </p>
    </div>
  );
}
