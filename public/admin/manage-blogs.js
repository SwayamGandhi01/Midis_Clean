// Preview selected image
document.getElementById('imageFile').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.getElementById('preview');
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// Handle form submission
document.getElementById('blogForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const title = formData.get('title');
  const content = formData.get('content');
  let imageUrl = formData.get('imageUrl');

  const file = document.getElementById('imageFile').files[0];

  if (file) {
    const reader = new FileReader();
    reader.onloadend = async function () {
      imageUrl = reader.result;
      await postBlog({ title, content, imageUrl });
    };
    reader.readAsDataURL(file);
  } else {
    await postBlog({ title, content, imageUrl });
  }
});

// Send blog data to backend
async function postBlog(data) {
  try {
    const res = await fetch('/api/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert('✅ Blog posted!');
      document.getElementById('blogForm').reset();
      document.getElementById('preview').style.display = 'none';
      loadBlogs();
    } else {
      const err = await res.json();
      alert(`❌ Failed to post blog: ${err.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error(err);
    alert('❌ Error posting blog.');
  }
}

// Load and display all blogs
async function loadBlogs() {
  try {
    const res = await fetch('/api/blogs');
    if (!res.ok) throw new Error('Failed to fetch blogs');

    const blogs = await res.json();
    const container = document.getElementById('blogList');
    container.innerHTML = '';

    if (blogs.length === 0) {
      container.innerHTML = '<p>No blogs yet.</p>';
      return;
    }

    blogs.forEach(blog => {
      const blogItem = document.createElement('div');
      blogItem.className = 'blog-item';

      const title = document.createElement('h3');
      title.textContent = blog.title;

      const date = document.createElement('p');
      date.innerHTML = `<em>${new Date(blog.createdAt).toLocaleDateString()}</em>`;

      const content = document.createElement('p');
      content.textContent = blog.content;

      blogItem.appendChild(title);
      blogItem.appendChild(date);

      if (blog.imageUrl) {
        const img = document.createElement('img');
        img.src = blog.imageUrl;
        img.alt = 'Blog Image';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        blogItem.appendChild(img);
      }

      blogItem.appendChild(content);

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑 Delete';
      delBtn.addEventListener('click', () => deleteBlog(blog._id));
      blogItem.appendChild(delBtn);

      container.appendChild(blogItem);
    });
  } catch (error) {
    console.error('Failed to load blogs:', error);
    document.getElementById('blogList').innerHTML =
      '<p style="color:red;">Failed to load blogs.</p>';
  }
}

// Delete a blog
async function deleteBlog(id) {
  const confirmDelete = confirm('Are you sure you want to delete this blog?');
  if (!confirmDelete) return;

  try {
    const res = await fetch('/api/blogs/' + id, {
      method: 'DELETE'
    });

    if (res.ok) {
      alert('🗑 Blog deleted!');
      loadBlogs();
    } else {
      const err = await res.json();
      alert(`Failed to delete: ${err.error || 'Unknown error'}`);
    }
  } catch (error) {
    alert('❌ Failed to delete blog.');
    console.error(error);
  }
}

// Initial load
loadBlogs();
