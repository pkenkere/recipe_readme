import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8000'

const categories = ['All', 'Produce', 'Protein', 'Dairy', 'Grains', 'Spices', 'Other']

function App() {
  const [ingredients, setIngredients] = useState([])
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [expandedQuantityId, setExpandedQuantityId] = useState(null)
  const [updatingQuantityId, setUpdatingQuantityId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'Produce',
    quantity: '',
    unit: 'g',
  })

  const fetchIngredients = async () => {
    try {
      const res = await fetch(`${API_URL}/ingredients`)
      if (!res.ok) {
        throw new Error('Unable to load pantry items')
      }
      const data = await res.json()
      setIngredients(data)
      setError('')
    } catch (err) {
      setIngredients([])
      setError('Could not reach the backend API. Please check that the server is running.')
    }
  }

  useEffect(() => {
    fetchIngredients()
  }, [])

  const filteredIngredients =
    selectedCategory === 'All'
      ? ingredients
      : ingredients.filter((item) => item.category === selectedCategory)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity || 0),
      unit: form.unit,
      in_stock: true,
    }

    const res = await fetch(`${API_URL}/ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setForm({ name: '', category: 'Produce', quantity: '', unit: 'g' })
      setShowAddModal(false)
      await fetchIngredients()
    }
  }

  const updateQuantity = async (item, direction) => {
    const method = direction === 'remove' ? 'DELETE' : 'POST'
    setUpdatingQuantityId(item.id)

    try {
      const res = await fetch(`${API_URL}/ingredients/${item.id}/quantity`, {
        method,
      })
      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}))
        throw new Error(responseBody.detail || 'Unable to update ingredient quantity')
      }
      const updatedItem = await res.json()
      const itemWasDeleted = updatedItem.deleted || Number(updatedItem.quantity) <= 0
      setIngredients((currentIngredients) => itemWasDeleted
        ? currentIngredients.filter((currentItem) => currentItem.id !== updatedItem.id)
        : currentIngredients.map((currentItem) => (
          currentItem.id === updatedItem.id
            ? { ...currentItem, quantity: updatedItem.quantity, in_stock: updatedItem.in_stock }
            : currentItem
        )))
      if (itemWasDeleted) {
        setExpandedQuantityId(null)
      }
      setError('')
    } catch (err) {
      setError(err.message || 'Could not update the ingredient quantity. Please try again.')
    } finally {
      setUpdatingQuantityId(null)
    }
  }

  return (
    <div className="phone-shell">
      <div className="phone-screen">
        <header className="app-topbar">
          <div className="topbar-left">
            <span className="title">Pantry</span>
          </div>
        </header>

        <section className="filter-row">
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </section>

        <main className="pantry-list">
          {error ? (
            <div className="error-state">{error}</div>
          ) : filteredIngredients.length === 0 ? (
            <div className="empty-state">No items in this category.</div>
          ) : (
            filteredIngredients.map((item) => (
              <article key={item.id} className="food-card">
                <div className="food-left">
                  <div className="food-icon" style={{ background: item.color || '#f0f0f0' }}>
                    {item.name?.charAt(0)?.toUpperCase() || 'I'}
                  </div>
                  <div className="food-copy">
                    <h3>{item.name}</h3>
                    <small>{item.category || 'Other'}</small>
                  </div>
                </div>
                <div
                  className={`status-pill quantity-badge ${expandedQuantityId === item.id ? 'expanded' : ''}`}
                  onClick={() => setExpandedQuantityId((currentId) => currentId === item.id ? null : item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setExpandedQuantityId((currentId) => currentId === item.id ? null : item.id)
                    }
                  }}
                  aria-label={`Quantity for ${item.name}`}
                >
                  {expandedQuantityId === item.id && (
                    <button
                      className="quantity-action"
                      onClick={(event) => {
                        event.stopPropagation()
                        if (item.quantity > 0 && updatingQuantityId !== item.id) updateQuantity(item, 'remove')
                      }}
                      disabled={item.quantity <= 0 || updatingQuantityId === item.id}
                      aria-label={`Remove one ${item.unit} of ${item.name}`}
                    >
                      −
                    </button>
                  )}
                  <span>{item.quantity} {item.unit}</span>
                  {expandedQuantityId === item.id && (
                    <button
                      className="quantity-action"
                      onClick={(event) => {
                        event.stopPropagation()
                        if (updatingQuantityId !== item.id) updateQuantity(item, 'add')
                      }}
                      disabled={updatingQuantityId === item.id}
                      aria-label={`Add one ${item.unit} of ${item.name}`}
                    >
                      +
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </main>

        <div className="floating-actions">
          <button className="fab" onClick={() => setShowAddModal(true)} aria-label="Add ingredient">+</button>
        </div>

        <nav className="bottom-nav">
          <button className="nav-btn active">🏠</button>
          <button className="nav-btn">🧾</button>
          <button className="nav-btn">🛒</button>
          <button className="nav-btn">⚙️</button>
        </nav>
      </div>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="add-form">
              <label>
                <span>Name</span>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Ingredient name" required />
              </label>

              <div className="two-col">
                <label>
                  <span>Category</span>
                  <select name="category" value={form.category} onChange={handleChange}>
                    <option>Produce</option>
                    <option>Dairy</option>
                    <option>Grains</option>
                    <option>Protein</option>
                    <option>Spices</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  <span>Qty</span>
                  <input name="quantity" value={form.quantity} onChange={handleChange} type="number" min="0" placeholder="0" />
                </label>
              </div>

              <label>
                <span>Unit</span>
                <input name="unit" value={form.unit} onChange={handleChange} placeholder="g, pcs, cups" />
              </label>

              <button type="submit" className="save-btn">Add to pantry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
