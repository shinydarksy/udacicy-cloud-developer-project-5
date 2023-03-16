import dateFormat from 'dateformat';
import { History } from 'history';
import update from 'immutability-helper';
import * as React from 'react';
import {
  Divider,
  Grid,
  Header,
  Input,
  Loader,
  Form
} from 'semantic-ui-react';

import { createTodo, deleteTodo, getTodos, updateTodo } from '../api/todos-api';
import Auth from '../auth/Auth';
import { TodoItem } from '../types/Todo';
import TodoItemCp from '../components/TodoItem';

interface TodosProps {
  auth: Auth;
  history: History;
}
interface TodosState {
  todos: TodoItem[];
  newTodoName: string;
  loadingTodos: boolean;
}
export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true
  };

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken());
      this.setState({
        todos,
        loadingTodos: false
      });
    } catch (error:any) {
      console.error(`Failed to fetch todos: ${error.message}`);
    }
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value });
  };

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`);
  };

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate();
      const nameTodo = this.state.newTodoName
      if (!nameTodo.trim()) {
        alert("Please not empy")
        return
      }

      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate,
        attachmentUrl: ''
      });
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      });
    } catch {
      alert('Todo creation failed');
    }
  };

  onTodoDelete = async (todoId: string, createdAt: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId);
      this.setState({
        todos: this.state.todos.filter((todo) => todo.todoId !== todoId)
      });
    } catch {
      alert('Todo deletion failed');
    }
  };

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos];
      await updateTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      });
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      });
    } catch {
      alert('Todo deletion failed');
    }
  };

  render() {
    return (
      <div>
        <Header as="h1">TODOs</Header>
        
        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    );
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Form.Field required>
            <Input
              action={{
                color: 'teal',
                labelPosition: 'left',
                icon: 'add',
                content: 'New task',
                onClick: this.onTodoCreate
              }}
              fluid
              actionPosition="left"
              placeholder="To change the world..."
              onChange={this.handleNameChange}

            />
          </Form.Field>
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    );
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading();
    }

    return this.renderTodosList();
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    );
  }

  renderTodosList() {
    return (
      <TodoItemCp
        onTodoDelete={this.onTodoDelete}
        onEditButtonClick={this.onEditButtonClick}
        onTodoCheck={this.onTodoCheck} 
        todos={this.state.todos}
      />
    );
  }

  calculateDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);

    return dateFormat(date, 'yyyy-mm-dd') as string;
  }
}